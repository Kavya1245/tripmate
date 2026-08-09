import httpx
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.destination import Destination
from app.repositories.destination_repo import DestinationRepository

class DestinationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.dest_repo = DestinationRepository(db)

    async def get_all_destinations(self, skip: int = 0, limit: int = 100):
        return await self.dest_repo.get_all(skip=skip, limit=limit)

    async def get_destination(self, dest_id):
        dest = await self.dest_repo.get_by_id(dest_id)
        if not dest:
            return None
        
        dest_dict = {
            "id": dest.id, "name": dest.name, "country": dest.country,
            "description": dest.description, "tags": dest.tags, "image_url": dest.image_url,
            "avg_budget": dest.avg_budget, "latitude": getattr(dest, "latitude", None),
            "longitude": getattr(dest, "longitude", None), "wiki_url": getattr(dest, "wiki_url", None),
            "external_rating": 4.2 + (len(dest.name) % 8) / 10.0,
            "external_reviews_count": 500 + (len(dest.name) * 13) % 5000
        }
        return dest_dict

    async def search_external(self, query: str) -> list[dict]:
        headers = {"User-Agent": "TripMateAI/1.0 (contact@tripmate.com)"}
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query", "format": "json", "prop": "pageimages|extracts|info",
            "inprop": "url", "exintro": True, "explaintext": True, "piprop": "thumbnail",
            "pithumbsize": 800, "generator": "search", "gsrsearch": query, "gsrlimit": 12
        }
        async with httpx.AsyncClient(headers=headers) as client:
            try:
                res = await client.get(url, params=params)
                data = res.json()
            except Exception:
                return []
            
        pages = data.get("query", {}).get("pages", {})
        results = []
        for page_id, page in pages.items():
            title = page.get("title")
            extract = page.get("extract")
            thumbnail = page.get("thumbnail", {}).get("source")
            if title and extract and "may refer to" not in extract:
                wiki_url = page.get("fullurl", f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}")
                results.append({
                    "id": str(uuid.uuid4()), "name": title, "country": "Global",
                    "description": extract[:250] + "..." if len(extract) > 250 else extract,
                    "image_url": thumbnail or "https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=2000&auto=format&fit=crop",
                    "tags": query, "avg_budget": 1500.0, "wiki_url": wiki_url
                })
        return results

    async def save_destination(self, dest_data: dict):
        existing = await self.dest_repo.get_by_name(dest_data.get("name", ""))
        if existing:
            dest = existing
        else:
            dest = await self.dest_repo.create(dest_data)
            
        return {
            "id": dest.id, "name": dest.name, "country": dest.country,
            "description": dest.description, "tags": dest.tags, "image_url": dest.image_url,
            "avg_budget": dest.avg_budget, "latitude": getattr(dest, "latitude", None),
            "longitude": getattr(dest, "longitude", None), "wiki_url": getattr(dest, "wiki_url", None),
            "external_rating": 4.2 + (len(dest.name) % 8) / 10.0,
            "external_reviews_count": 500 + (len(dest.name) * 13) % 5000
        }

    async def fetch_and_seed_external(self) -> int:
        # Curated list of 15 famous places
        famous_places = [
            {"name": "Taj Mahal", "country": "India", "tags": "monument,romance,history", "image_url": "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=2000&auto=format&fit=crop", "avg_budget": 800, "description": "An ivory-white marble mausoleum on the right bank of the river Yamuna in Agra."},
            {"name": "Red Fort", "country": "India", "tags": "monument,history,capital", "image_url": "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2000&auto=format&fit=crop", "avg_budget": 600, "description": "A historic fort in the Old Delhi neighborhood of Delhi, India."},
            {"name": "Goa Beaches", "country": "India", "tags": "beach,party,relaxation", "image_url": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=2000&auto=format&fit=crop", "avg_budget": 700, "description": "Famous for their palm-lined stretches of sand and vibrant nightlife."},
            {"name": "Ladakh", "country": "India", "tags": "mountain,adventure,nature", "image_url": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1200, "description": "A region administered by India as a union territory. Known for its remote mountain beauty."},
            {"name": "Eiffel Tower", "country": "France", "tags": "monument,city,romance", "image_url": "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2500, "description": "A wrought-iron lattice tower on the Champ de Mars in Paris."},
            {"name": "Colosseum", "country": "Italy", "tags": "ruins,history,city", "image_url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2200, "description": "The largest amphitheater ever built, located in the center of the city of Rome."},
            {"name": "Grand Canyon", "country": "USA", "tags": "nature,adventure,hiking", "image_url": "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2000, "description": "A steep-sided canyon carved by the Colorado River in Arizona."},
            {"name": "Great Wall of China", "country": "China", "tags": "monument,history,hiking", "image_url": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1500, "description": "A series of fortifications made of stone, brick, tamped earth, wood, and other materials."},
            {"name": "Machu Picchu", "country": "Peru", "tags": "ruins,history,mountain", "image_url": "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1800, "description": "A 15th-century Inca citadel located in the Andes Mountains."},
            {"name": "Christ the Redeemer", "country": "Brazil", "tags": "monument,religious,city", "image_url": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1700, "description": "A statue of Jesus Christ in Rio de Janeiro, created by French sculptor Paul Landowski."},
            {"name": "Sydney Opera House", "country": "Australia", "tags": "architecture,city,culture", "image_url": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=2000&auto=format&fit=crop", "avg_budget": 3000, "description": "A multi-venue performing arts centre in Sydney."},
            {"name": "Pyramids of Giza", "country": "Egypt", "tags": "ruins,history,desert", "image_url": "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1400, "description": "The Giza pyramid complex is an archaeological site on the Giza Plateau, on the outskirts of Cairo, Egypt."},
            {"name": "Santorini", "country": "Greece", "tags": "island,beach,romance", "image_url": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2600, "description": "An island in the southern Aegean Sea. It is famous for its whitewashed, cubiform houses."},
            {"name": "Burj Khalifa", "country": "UAE", "tags": "city,architecture,luxury", "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2800, "description": "A skyscraper in Dubai, United Arab Emirates. It is the tallest structure and building in the world."},
            {"name": "Mount Fuji", "country": "Japan", "tags": "mountain,nature,hiking", "image_url": "https://images.unsplash.com/photo-1570459027562-4a916cb6235e?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2000, "description": "An active volcano about 100km southwest of Tokyo. It is a very prominent feature of Japanese geography."}
        ]

        added_count = 0
        for p in famous_places:
            exists = await self.dest_repo.get_by_name(p["name"])
            if not exists:
                new_dest = Destination(
                    name=p["name"], country=p["country"], description=p["description"],
                    tags=p["tags"], image_url=p["image_url"], avg_budget=float(p["avg_budget"])
                )
                await self.dest_repo.create(p)
                added_count += 1
                
        return added_count
