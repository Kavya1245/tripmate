import json
import httpx
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.user import User
from app.services.rag_service import RagService
from app.repositories.chat_repo import ChatRepository

async def get_live_weather(location: str) -> str:
    """Fetches real live weather from Open-Meteo."""
    async with httpx.AsyncClient() as client:
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1"
        geo_res = await client.get(geo_url)
        geo_data = geo_res.json()
        if not geo_data.get("results"): return "Location not found."
        lat = geo_data["results"][0]["latitude"]
        lon = geo_data["results"][0]["longitude"]
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        weather_res = await client.get(weather_url)
        weather_data = weather_res.json()
        temp = weather_data["current_weather"]["temperature"]
        wind = weather_data["current_weather"]["windspeed"]
        return f"The current live weather in {location} is {temp}°C with a wind speed of {wind} km/h."

class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = AsyncOpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        self.rag_service = RagService()
        self.chat_repo = ChatRepository(db)

    async def get_chat_history(self, user_id):
        return await self.chat_repo.get_history_by_user(user_id)

    async def send_message(self, user: User, user_message: str):
        # 1. Save user message via Repo
        await self.chat_repo.create({"user_id": user.id, "role": "user", "content": user_message})

        # 2. Get history & RAG context
        history = await self.get_chat_history(user.id)
        context = self.rag_service.search_context(user_message, n_results=1)
        
        messages = [
            {"role": "system", "content": f"You are TripMate, a friendly AI travel concierge. Context from travel guide: {context}. If asked about weather, use the get_weather tool."}
        ]
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "description": "Get the current live weather for a specific city or location",
                    "parameters": {
                        "type": "object",
                        "properties": {"location": {"type": "string", "description": "The city or place name, e.g. Bali, Paris"}},
                        "required": ["location"]
                    }
                }
            }
        ]

        # 3. Call LLM
        response = await self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=tools,
            tool_choice="auto",
            max_tokens=500
        )
        response_message = response.choices[0].message

        # 4. Check for tool call
        if response_message.tool_calls:
            messages.append(response_message)
            for tool_call in response_message.tool_calls:
                if tool_call.function.name == "get_weather":
                    args = json.loads(tool_call.function.arguments)
                    location = args.get("location")
                    weather_result = await get_live_weather(location)
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": "get_weather",
                        "content": weather_result,
                    })
            
            second_response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=500
            )
            ai_text = second_response.choices[0].message.content
        else:
            ai_text = response_message.content

        # 5. Save AI response via Repo
        return await self.chat_repo.create({"user_id": user.id, "role": "assistant", "content": ai_text})
