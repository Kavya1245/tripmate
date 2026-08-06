import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.destination import Destination
from app.repositories.destination_repo import DestinationRepository

class DestinationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.dest_repo = DestinationRepository(db)

    # Pass skip and limit to repository
    async def get_all_destinations(self, skip: int = 0, limit: int = 10):
        return await self.dest_repo.get_all(skip=skip, limit=limit)

    async def get_destination(self, dest_id):
        return await self.dest_repo.get_by_id(dest_id)

    async def fetch_and_seed_external(self) -> int:
        monuments = [
            "Taj Mahal", "Red Fort", "Amer Fort", "Qutub Minar", "Hawa Mahal",
            "Hampi", "Ajanta Caves", "Mysore Palace", "Fatehpur Sikri", "Khajuraho",
            "Charminar", "Golden Temple", "Varanasi", "Konark Sun Temple", "Mahabalipuram",
            "Eiffel Tower", "Colosseum", "Machu Picchu", "Petra", "Burj Khalifa"
        ]
        added_count = 0
        async with httpx.AsyncClient() as client:
            for name in monuments:
                if await self.dest_repo.get_by_name(name):
                    continue
                try:
                    res = await client.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{name}")
                    if res.status_code == 200:
                        data = res.json()
                        description = data.get("extract", f"{name} is a famous tourist destination.")
                        image_url = data.get("originalimage", {}).get("source", "https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=2000&auto=format&fit=crop")
                        
                        dest_data = {
                            "name": name, "country": "International", "description": description,
                            "tags": "landmark,history,culture", "image_url": image_url, "avg_budget": 1500.0
                        }
                        await self.dest_repo.create(dest_data)
                        added_count += 1
                except Exception as e:
                    print(f"Failed to fetch {name}: {e}")
        return added_count
