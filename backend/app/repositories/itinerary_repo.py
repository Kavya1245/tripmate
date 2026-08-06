from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.itinerary import ItineraryItem
from app.schemas.itinerary import ItineraryItemUpdate
import uuid

class ItineraryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, item_data: dict) -> ItineraryItem:
        db_item = ItineraryItem(**item_data)
        self.db.add(db_item)
        await self.db.commit()
        await self.db.refresh(db_item)
        return db_item

    async def get_by_id(self, item_id: uuid.UUID) -> ItineraryItem | None:
        return await self.db.get(ItineraryItem, item_id)

    async def delete(self, db_item: ItineraryItem) -> None:
        await self.db.delete(db_item)
        await self.db.commit()

    async def update(self, db_item: ItineraryItem, item_in: ItineraryItemUpdate) -> ItineraryItem:
        update_data = item_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_item, field, value)
        self.db.add(db_item)
        await self.db.commit()
        await self.db.refresh(db_item)
        return db_item
