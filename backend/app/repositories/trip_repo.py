from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripUpdate
from app.repositories.base import BaseRepository
import uuid

class TripRepository(BaseRepository[Trip, TripCreate]):
    def __init__(self, db: AsyncSession):
        super().__init__(Trip, db)

    async def get_by_user(self, user_id: uuid.UUID) -> List[Trip]:
        result = await self.db.execute(select(Trip).where(Trip.user_id == user_id))
        return result.scalars().all()

    async def get_user_trip_by_id(self, trip_id: uuid.UUID, user_id: uuid.UUID) -> Trip | None:
        result = await self.db.execute(
            select(Trip).where(Trip.id == trip_id, Trip.user_id == user_id)
        )
        return result.scalar_one_or_none()

    # Create a custom create method to accept user_id
    async def create_trip(self, obj_in: TripCreate, user_id: uuid.UUID) -> Trip:
        db_obj = Trip(
            **obj_in.model_dump(),
            user_id=user_id
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: Trip, obj_in: TripUpdate) -> Trip:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, db_obj: Trip) -> None:
        await self.db.delete(db_obj)
        await self.db.commit()
