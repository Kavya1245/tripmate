import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.destination import Destination
from app.repositories.destination_repo import DestinationRepository

class DestinationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.dest_repo = DestinationRepository(db)

    async def get_all_destinations(self, skip: int = 0, limit: int = 10):
        return await self.dest_repo.get_all(skip=skip, limit=limit)

    async def get_destination(self, dest_id):
        return await self.dest_repo.get_by_id(dest_id)

    async def fetch_and_seed_external(self) -> int:
        # Expanded list: 17 Indian landmarks + 35 International landmarks
        monuments = [
            # India
            "Taj Mahal", "Red Fort", "Hawa Mahal", "Gateway of India", "Mysore Palace",
            "Lotus Temple", "Qutub Minar", "Charminar", "Victoria Memorial", "Amer Fort",
            "Kerala Backwaters", "Goa Beaches", "Ladakh", "Varanasi", "Konark Sun Temple",
            "Meenakshi Temple", "Ranthambore National Park",
            # World
            "Eiffel Tower", "Colosseum", "Statue of Liberty", "Sydney Opera House", "Big Ben",
            "Machu Picchu", "Christ the Redeemer", "Great Wall of China", "Pyramids of Giza",
            "Stonehenge", "Niagara Falls", "Grand Canyon", "Santorini", "Mount Fuji",
            "Burj Khalifa", "Petronas Towers", "London Eye", "The Louvre", "Times Square",
            "Vatican City", "Acropolis of Athens", "Hagia Sophia", "Blue Mosque", "CN Tower",
            "Golden Gate Bridge", "Mount Rushmore", "Tokyo Tower", "Merlion Park",
            "Neuschwanstein Castle", "Edinburgh Castle", "Cliffs of Moher", "Milan Cathedral",
            "Park Guell"
        ]
        
        added_count = 0
        async with httpx.AsyncClient(timeout=10.0) as client:
            for name in monuments:
                if await self.dest_repo.get_by_name(name):
                    continue
                
                try:
                    res = await client.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{name}")
                    if res.status_code == 200:
                        data = res.json()
                        description = data.get("extract", f"{name} is a famous tourist destination.")
                        image_url = data.get("originalimage", {}).get("source")
                        
                        if not image_url:
                            image_url = "https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=2000&auto=format&fit=crop"

                        dest_data = {
                            "name": name,
                            "country": "International", 
                            "description": description,
                            "tags": "landmark,history,culture",
                            "image_url": image_url,
                            "avg_budget": 1500.0
                        }
                        await self.dest_repo.create(dest_data)
                        added_count += 1
                except Exception as e:
                    print(f"Failed to fetch {name}: {e}")
        return added_count
