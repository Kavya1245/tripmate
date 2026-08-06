import json
import httpx
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.user import User
from app.services.rag_service import RagService
from app.repositories.chat_repo import ChatRepository

async def get_live_weather(location: str) -> str:
    location = location.title()
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

async def get_currency_conversion(amount: float, from_currency: str, to_currency: str) -> str:
    """Fetches live currency exchange rates."""
    async with httpx.AsyncClient() as client:
        url = f"https://open.er-api.com/v6/latest/{from_currency.upper()}"
        res = await client.get(url)
        if res.status_code != 200:
            return "Failed to fetch currency data."
        
        data = res.json()
        rate = data.get("rates", {}).get(to_currency.upper())
        if not rate:
            return f"Could not find exchange rate for {to_currency}."
        
        converted = amount * rate
        return f"{amount} {from_currency.upper()} is approximately {converted:.2f} {to_currency.upper()} (Rate: 1 {from_currency.upper()} = {rate} {to_currency.upper()})."

class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = AsyncOpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        self.rag_service = RagService()
        self.chat_repo = ChatRepository(db)

    async def get_chat_history(self, user_id):
        return await self.chat_repo.get_history_by_user(user_id)

    async def send_message(self, user: User, user_message: str):
        await self.chat_repo.create({"user_id": user.id, "role": "user", "content": user_message})

        history = await self.get_chat_history(user.id)
        context = self.rag_service.search_context(user_message, n_results=1)
        
        messages = [
            {"role": "system", "content": f"You are TripMate, a friendly AI travel concierge. Context from travel guide: {context}. You are an AI assistant connected to live tools. You are STRICTLY FORBIDDEN from saying you lack access to real-time data. If the user asks about weather, temperature, or climate, you MUST call the get_weather tool. If they ask about currency, exchange rates, or money conversion, you MUST call the get_currency_conversion tool. Never give disclaimers about real-time data; always use the tools."}
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
            },
            {
                "type": "function",
                "function": {
                    "name": "get_currency_conversion",
                    "description": "Convert an amount from one currency to another using live exchange rates",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "amount": {"type": "number", "description": "The amount of money to convert"},
                            "from_currency": {"type": "string", "description": "The 3-letter currency code to convert from, e.g. USD"},
                            "to_currency": {"type": "string", "description": "The 3-letter currency code to convert to, e.g. EUR or IDR"}
                        },
                        "required": ["amount", "from_currency", "to_currency"]
                    }
                }
            }
        ]

        # Expanded keyword detection for forcing tool calls
        msg_lower = user_message.lower()
        weather_keywords = ["weather", "temperature", "climate"]
        currency_keywords = ["currency", "convert", "exchange", "usd", "inr", "eur", "money", "dollars", "rupees", "pounds"]
        
        if any(word in msg_lower for word in weather_keywords) or any(word in msg_lower for word in currency_keywords):
            tool_choice = "required"
        else:
            tool_choice = "auto"

        response = await self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=tools,
            tool_choice=tool_choice,
            max_tokens=500
        )
        response_message = response.choices[0].message

        if response_message.tool_calls:
            messages.append(response_message)
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)
                
                if function_name == "get_weather":
                    tool_result = await get_live_weather(args.get("location", ""))
                elif function_name == "get_currency_conversion":
                    tool_result = await get_currency_conversion(
                        args.get("amount", 0), 
                        args.get("from_currency", "USD"), 
                        args.get("to_currency", "USD")
                    )
                else:
                    tool_result = "Tool not found."
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": function_name,
                    "content": tool_result,
                })
            
            second_response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=500
            )
            ai_text = second_response.choices[0].message.content
        else:
            ai_text = response_message.content

        return await self.chat_repo.create({"user_id": user.id, "role": "assistant", "content": ai_text})
