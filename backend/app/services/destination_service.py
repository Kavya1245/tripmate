import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.destination import Destination
from app.repositories.destination_repo import DestinationRepository

class DestinationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.dest_repo = DestinationRepository(db)

    async def get_all_destinations(self, skip: int = 0, limit: int = 100):
        return await self.dest_repo.get_all(skip=skip, limit=limit)

    async def get_destination(self, dest_id):
        return await self.dest_repo.get_by_id(dest_id)

    async def fetch_and_seed_external(self) -> int:
        # Guaranteed list of 25 famous places with real images
        famous_places = [
            {"name": "Taj Mahal", "country": "India", "tags": "monument,romance,history", "image_url": "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=2000&auto=format&fit=crop", "avg_budget": 800, "description": "An ivory-white marble mausoleum on the right bank of the river Yamuna in Agra. A UNESCO World Heritage site."},
            {"name": "Red Fort", "country": "India", "tags": "monument,history,capital", "image_url": "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2000&auto=format&fit=crop", "avg_budget": 600, "description": "A historic fort in the Old Delhi neighborhood of Delhi, India, that served as the main residence of the Mughal Emperors."},
            {"name": "Gateway of India", "country": "India", "tags": "monument,city,history", "image_url": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=2000&auto=format&fit=crop", "avg_budget": 700, "description": "An arch-monument built in the early twentieth century in the city of Mumbai, India."},
            {"name": "Hawa Mahal", "country": "India", "tags": "palace,history,architecture", "image_url": "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=2000&auto=format&fit=crop", "avg_budget": 600, "description": "The 'Palace of Winds' is a palace in Jaipur, India. Made with red and pink sandstone."},
            {"name": "Kerala Backwaters", "country": "India", "tags": "nature,water,relaxation", "image_url": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2000&auto=format&fit=crop", "avg_budget": 900, "description": "A network of brackish lagoons and lakes lying parallel to the Arabian Sea coast of Kerala state in southern India."},
            {"name": "Varanasi Ghats", "country": "India", "tags": "river,religious,culture", "image_url": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=2000&auto=format&fit=crop", "avg_budget": 500, "description": "A series of steps leading down to the holy river Ganges in Varanasi, one of the oldest continuously inhabited cities in the world."},
            {"name": "Eiffel Tower", "country": "France", "tags": "monument,city,romance", "image_url": "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2500, "description": "A wrought-iron lattice tower on the Champ de Mars in Paris, widely considered a global cultural icon of France."},
            {"name": "Colosseum", "country": "Italy", "tags": "ruins,history,city", "image_url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2200, "description": "The largest amphitheater ever built, located in the center of the city of Rome."},
            {"name": "Grand Canyon", "country": "USA", "tags": "nature,adventure,hiking", "image_url": "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2000, "description": "A steep-sided canyon carved by the Colorado River in Arizona. Known for its overwhelming size and intricate landscape."},
            {"name": "Great Wall of China", "country": "China", "tags": "monument,history,hiking", "image_url": "https://images.unsplash.com/photo-1508804185872-d7badad00d7d?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1500, "description": "A series of fortifications made of stone, brick, tamped earth, wood, and other materials."},
            {"name": "Machu Picchu", "country": "Peru", "tags": "ruins,history,mountain", "image_url": "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1800, "description": "A 15th-century Inca citadel located in the Andes Mountains. Often mistakenly referred to as the 'Lost City of the Incas'."},
            {"name": "Christ the Redeemer", "country": "Brazil", "tags": "monument,religious,city", "image_url": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1700, "description": "A statue of Jesus Christ in Rio de Janeiro, created by French sculptor Paul Landowski."},
            {"name": "Sydney Opera House", "country": "Australia", "tags": "architecture,city,culture", "image_url": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=2000&auto=format&fit=crop", "avg_budget": 3000, "description": "A multi-venue performing arts centre in Sydney. It is one of the 20th century's most famous and distinctive buildings."},
            {"name": "Pyramids of Giza", "country": "Egypt", "tags": "ruins,history,desert", "image_url": "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1400, "description": "The Giza pyramid complex is an archaeological site on the Giza Plateau, on the outskirts of Cairo, Egypt."},
            {"name": "Santorini", "country": "Greece", "tags": "island,beach,romance", "image_url": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2600, "description": "An island in the southern Aegean Sea. It is famous for its whitewashed, cubiform houses built on cliffs overlooking the sea."},
            {"name": "Niagara Falls", "country": "Canada", "tags": "nature,waterfall,adventure", "image_url": "https://images.unsplash.com/photo-1580703351935-9a6fede6f5e8?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1600, "description": "A group of three waterfalls spanning the border between the province of Ontario in Canada and the state of New York."},
            {"name": "Petra", "country": "Jordan", "tags": "ruins,history,desert", "image_url": "https://images.unsplash.com/photo-1518790374246-fec1d4c5e8b1?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1300, "description": "A historic and archaeological city in southern Jordan. Famous for its rock-cut architecture and water conduit system."},
            {"name": "Burj Khalifa", "country": "UAE", "tags": "city,architecture,luxury", "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2800, "description": "A skyscraper in Dubai, United Arab Emirates. It is the tallest structure and building in the world."},
            {"name": "Mount Fuji", "country": "Japan", "tags": "mountain,nature,hiking", "image_url": "https://images.unsplash.com/photo-1570459027562-4a916cb6235e?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2000, "description": "An active volcano about 100km southwest of Tokyo. It is a very prominent feature of Japanese geography."},
            {"name": " Statue of Liberty", "country": "USA", "tags": "monument,history,city", "image_url": "https://images.unsplash.com/photo-1544014350-6a1b1f5e0f63?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2100, "description": "A colossal neoclassical sculpture on Liberty Island in New York Harbor in New York City."},
            {"name": "Big Ben", "country": "UK", "tags": "monument,city,history", "image_url": "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?q=80&w=2000&auto=format&fit=crop", "avg_budget": 2400, "description": "The nickname for the Great Bell of the striking clock at the north end of the Palace of Westminster in London."},
            {"name": "Stonehenge", "country": "UK", "tags": "ruins,history,mystery", "image_url": "https://images.unsplash.com/photo-159521637459-9c1f46c1e63b?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1800, "description": "A prehistoric monument on Salisbury Plain in Wiltshire, England, consisting of an outer ring of vertical sarsen standing stones."},
            {"name": "Goa Beaches", "country": "India", "tags": "beach,party,relaxation", "image_url": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=2000&auto=format&fit=crop", "avg_budget": 700, "description": "Famous for their palm-lined stretches of sand and vibrant nightlife. A top tourist destination in India."},
            {"name": "Ladakh", "country": "India", "tags": "mountain,adventure,nature", "image_url": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2000&auto=format&fit=crop", "avg_budget": 1200, "description": "A region administered by India as a union territory. Known for its remote mountain beauty and Buddhist culture."},
            {"name": "Mysore Palace", "country": "India", "tags": "palace,history,culture", "image_url": "https://images.unsplash.com/photo-1605649461784-1a8d50e6e86b?q=80&w=2000&auto=format&fit=crop", "avg_budget": 700, "description": "A historical palace and a royal residence at Mysore in the Indian State of Karnataka."}
        ]

        added_count = 0
        for p in famous_places:
            exists = await self.dest_repo.get_by_name(p["name"])
            if not exists:
                new_dest = Destination(
                    name=p["name"],
                    country=p["country"],
                    description=p["description"],
                    tags=p["tags"],
                    image_url=p["image_url"],
                    avg_budget=float(p["avg_budget"])
                )
                await self.dest_repo.create(p)
                added_count += 1
                
        return added_count
