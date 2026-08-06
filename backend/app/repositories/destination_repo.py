from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.destination import Destination
import uuid

class DestinationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Added skip and limit
    async def get_all(self, skip: int = 0, limit: int = 10) -> List[Destination]:
        result = await self.db.execute(select(Destination).offset(skip).limit(limit))
        return result.scalars().all()

    async def get_by_id(self, dest_id: uuid.UUID) -> Destination | None:
        return await self.db.get(Destination, dest_id)

    async def get_by_name(self, name: str) -> Destination | None:
        result = await self.db.execute(select(Destination).where(Destination.name == name))
        return result.scalar_one_or_none()

    async def create(self, dest_data: dict) -> Destination:
        new_dest = Destination(**dest_data)
        self.db.add(new_dest)
        await self.db.commit()
        await self.db.refresh(new_dest)
        return new_dest
