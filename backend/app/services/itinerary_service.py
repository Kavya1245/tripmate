from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.itinerary_repo import ItineraryRepository
from app.schemas.itinerary import ItineraryItemCreate
import uuid

class ItineraryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.itinerary_repo = ItineraryRepository(db)

    async def create_item(self, item_in: ItineraryItemCreate) -> dict:
        # In a full enterprise app, we'd verify the trip belongs to the user here
        return await self.itinerary_repo.create(item_in.model_dump())

    async def delete_item(self, item_id: uuid.UUID) -> None:
        item = await self.itinerary_repo.get_by_id(item_id)
        if item:
            await self.itinerary_repo.delete(item)
