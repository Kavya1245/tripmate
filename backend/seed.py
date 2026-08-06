import asyncio
from app.db.session import AsyncSessionLocal
from app.models.destination import Destination
from sqlalchemy import select

async def seed_data():
    async with AsyncSessionLocal() as db:
        # Check if data already exists
        result = await db.execute(select(Destination).limit(1))
        if result.scalars().first():
            print("Destinations already seeded.")
            return

        destinations = [
            Destination(name="Bali", country="Indonesia", description="Tropical paradise with lush rice terraces and vibrant culture.", tags="beach,culture,nature", image_url="https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2000&auto=format&fit=crop", avg_budget=1200.0),
            Destination(name="Paris", country="France", description="The city of love, lights, and unparalleled cuisine.", tags="city,culture,romance", image_url="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2000&auto=format&fit=crop", avg_budget=2500.0),
            Destination(name="Tokyo", country="Japan", description="A bustling metropolis blending ultra-modern and traditional cultures.", tags="city,food,tech", image_url="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2000&auto=format&fit=crop", avg_budget=2000.0),
            Destination(name="Swiss Alps", country="Switzerland", description="Majestic snow-capped mountains and adventure sports.", tags="mountain,adventure,nature", image_url="https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2000&auto=format&fit=crop", avg_budget=3000.0)
        ]
        
        db.add_all(destinations)
        await db.commit()
        print("Successfully seeded 4 destinations!")

asyncio.run(seed_data())
