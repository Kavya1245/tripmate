import json
import re
import httpx
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.user import User
from app.services.rag_service import RagService
from app.repositories.chat_repo import ChatRepository
from app.repositories.itinerary_repo import ItineraryRepository
from app.repositories.trip_repo import TripRepository
from app.schemas.itinerary import ItineraryItemCreate
from app.schemas.trip import TripCreate

async def get_live_weather(location: str) -> str:
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
    async with httpx.AsyncClient() as client:
        url = f"https://open.er-api.com/v6/latest/{from_currency.upper()}"
        res = await client.get(url)
        if res.status_code != 200: return "Failed to fetch currency data."
        data = res.json()
        rate = data.get("rates", {}).get(to_currency.upper())
        if not rate: return f"Could not find exchange rate for {to_currency}."
        converted = amount * rate
        return f"{amount} {from_currency.upper()} is approximately {converted:.2f} {to_currency.upper()}."

class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = AsyncOpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        self.rag_service = RagService()
        self.chat_repo = ChatRepository(db)
        self.itinerary_repo = ItineraryRepository(db)
        self.trip_repo = TripRepository(db)

    async def get_chat_history(self, user_id):
        return await self.chat_repo.get_history_by_user(user_id)

    async def send_message(self, user: User, user_message: str, trip_id: str | None = None):
        await self.chat_repo.create({"user_id": user.id, "role": "user", "content": user_message})

        history = await self.get_chat_history(user.id)
        context = self.rag_service.search_context(user_message, n_results=1)
        
        system_prompt = f"""You are TripMate, a friendly AI travel concierge. The current date is August 2026.
To perform actions, you MUST use specific text tags. Do not use JSON or function calls.
- To get weather: Output exactly `[GET_WEATHER]location[/GET_WEATHER]`
- To get currency: Output exactly `[GET_CURRENCY]amount from_currency to_currency[/GET_CURRENCY]`
- To save a trip (ONLY when user explicitly asks to save): Output exactly `[SAVE_TRIP]{{"title":"...", "start_date":"YYYY-MM-DD", "end_date":"YYYY-MM-DD", "budget":1000}}[/SAVE_TRIP]`
- Immediately after a [SAVE_TRIP] block, you MUST output the itinerary inside `[ITINERARY]` and `[/ITINERARY]` tags. Each line must be `Day X | HH:MM | Activity | Notes`.

CONVERSATIONAL FLOW:
1. If the user asks to plan a trip, generate a proposed itinerary in text. Ask for dates/budget/changes. DO NOT output [SAVE_TRIP] yet.
2. Once the user confirms and explicitly says 'save it' or 'yes', output the [SAVE_TRIP] block and [ITINERARY] block.
Context from travel guide: {context}"""

        messages = [{"role": "system", "content": system_prompt}]
        
        # Only send the last 6 messages to prevent 413 Payload Too Large errors
        recent_history = history[-6:] if len(history) > 6 else history
        for msg in recent_history:
            # Clean old tags from history so AI doesn't get confused by past raw text
            clean_hist = msg.content
            clean_hist = re.sub(r"\[SAVE_TRIP\].*?\[/SAVE_TRIP\]", "[SAVE_TRIP][/SAVE_TRIP]", clean_hist, flags=re.DOTALL).strip()
            clean_hist = re.sub(r"\[ITINERARY\].*?\[/ITINERARY\]", "[ITINERARY][/ITINERARY]", clean_hist, flags=re.DOTALL).strip()
            clean_hist = re.sub(r"\[GET_WEATHER\].*?\[/GET_WEATHER\]", "", clean_hist, flags=re.DOTALL).strip()
            clean_hist = re.sub(r"\[GET_CURRENCY\].*?\[/GET_CURRENCY\]", "", clean_hist, flags=re.DOTALL).strip()
            messages.append({"role": msg.role, "content": clean_hist})

        try:
            # NO TOOLS PASSED TO API! This prevents all Groq 400 errors.
            response = await self.client.chat.completions.create(
                model="llama-3.1-8b-instant", messages=messages, max_tokens=1500
            )
            ai_text = response.choices[0].message.content
        except Exception as api_error:
            err_str = str(api_error)
            if "429" in err_str:
                return await self.chat_repo.create({"user_id": user.id, "role": "assistant", "content": "I'm currently experiencing high traffic or rate limits on the free AI tier. Please wait an hour and try again, or switch the API key."})
            return await self.chat_repo.create({"user_id": user.id, "role": "assistant", "content": f"Backend Error: {err_str}"})

        # --- TEXT-BASED AGENT PROCESSING ---
        actions_taken = []
        active_trip_id = trip_id

        # 1. Check for Weather
        weather_match = re.search(r"\[GET_WEATHER\](.*?)\[/GET_WEATHER\]", ai_text, re.DOTALL)
        if weather_match:
            loc = weather_match.group(1).strip()
            weather_result = await get_live_weather(loc)
            ai_text = ai_text.replace(weather_match.group(0), f"[WEATHER_RESULT]{weather_result}[/WEATHER_RESULT]")
            actions_taken.append("Weather")

        # 2. Check for Currency
        curr_match = re.search(r"\[GET_CURRENCY\](.*?)\[/GET_CURRENCY\]", ai_text, re.DOTALL)
        if curr_match:
            parts = curr_match.group(1).strip().split()
            if len(parts) == 4:
                amt, from_c, _, to_c = parts
                curr_result = await get_currency_conversion(float(amt), from_c, to_c)
                ai_text = ai_text.replace(curr_match.group(0), f"[CURRENCY_RESULT]{curr_result}[/CURRENCY_RESULT]")
                actions_taken.append("Currency")

        # 3. Check for Save Trip
        save_match = re.search(r"\[SAVE_TRIP\](.*?)(?:\[/SAVE_TRIP\]|\[ITINERARY\]|$)", ai_text, re.DOTALL)
        if save_match:
            try:
                trip_data = json.loads(save_match.group(1).strip())
                budget_val = float(trip_data.get("budget", 1000))
                trip_in = TripCreate(
                    title=trip_data.get("title", "New Trip"),
                    start_date=trip_data.get("start_date"),
                    end_date=trip_data.get("end_date"),
                    budget=budget_val,
                    status="planning"
                )
                new_trip = await self.trip_repo.create_trip(trip_in, user.id)
                active_trip_id = str(new_trip.id)
                actions_taken.append("Saved Trip")
                ai_text += "\n[TRIP_CREATED]"
            except Exception:
                pass # Ignore JSON parse errors silently

        # 4. Check for Itinerary
        itin_match = re.search(r"\[ITINERARY\](.*?)\[/ITINERARY\]|\[ITINERARY\](.*)$", ai_text, re.DOTALL)
        if itin_match and active_trip_id:
            # Use group 1 if closing tag was found, otherwise group 2
            itinerary_text = (itin_match.group(1) or itin_match.group(2) or "").strip()
            lines = itinerary_text.split('\n')
            for line in lines:
                line = line.strip()
                if not line: continue
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 3:
                    day_match = re.search(r'\d+', parts[0])
                    if day_match:
                        day_no = int(day_match.group())
                        activity = parts[2]
                        time_str = parts[1] if len(parts[1]) == 5 else None
                        notes = parts[3] if len(parts) > 3 else None
                        item_in = ItineraryItemCreate(trip_id=active_trip_id, day_no=day_no, activity=activity, time=time_str, notes=notes)
                        await self.itinerary_repo.create(item_in.model_dump())
            
            if "Saved Trip" in actions_taken:
                ai_text += "\n[ITINERARY_SAVED]"

        # 5. If actions were taken that require a follow-up (Weather/Currency), call API again to summarize
        if "Weather" in actions_taken or "Currency" in actions_taken:
            messages.append({"role": "assistant", "content": ai_text})
            messages.append({"role": "user", "content": "Please summarize the results for me."})
            try:
                follow_up = await self.client.chat.completions.create(model="llama-3.1-8b-instant", messages=messages, max_tokens=500)
                ai_text = follow_up.choices[0].message.content
            except:
                pass

        # --- FINAL CLEANUP FOR USER UI ---
        # Remove all raw tags before saving to DB so the user doesn't see them
        final_text = re.sub(r"\[SAVE_TRIP\].*?\[/SAVE_TRIP\]", "", ai_text, flags=re.DOTALL).strip()
        final_text = re.sub(r"\[ITINERARY\].*?\[/ITINERARY\]", "✅ Itinerary generated and saved to your trips!", final_text, flags=re.DOTALL).strip()
        final_text = re.sub(r"\[GET_WEATHER\].*?\[/GET_WEATHER\]", "", final_text, flags=re.DOTALL).strip()
        final_text = re.sub(r"\[GET_CURRENCY\].*?\[/GET_CURRENCY\]", "", final_text, flags=re.DOTALL).strip()
        final_text = re.sub(r"\[WEATHER_RESULT\].*?\[/WEATHER_RESULT\]", "", final_text, flags=re.DOTALL).strip()
        final_text = re.sub(r"\[CURRENCY_RESULT\].*?\[/CURRENCY_RESULT\]", "", final_text, flags=re.DOTALL).strip()

        # If trip was saved, ensure the tag is at the very end for frontend to catch
        if "[TRIP_CREATED]" in ai_text and "[TRIP_CREATED]" not in final_text:
            final_text += "\n[TRIP_CREATED]"
        if "[ITINERARY_SAVED]" in ai_text and "[ITINERARY_SAVED]" not in final_text:
            final_text += "\n[ITINERARY_SAVED]"

        return await self.chat_repo.create({"user_id": user.id, "role": "assistant", "content": final_text})
