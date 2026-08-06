from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.repositories.trip_repo import TripRepository
from app.schemas.trip import TripCreate, TripUpdate
from app.models.trip import Trip

class TripService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.trip_repo = TripRepository(db)

    async def create_trip(self, trip_in: TripCreate, user_id: uuid.UUID) -> Trip:
        return await self.trip_repo.create_trip(trip_in, user_id)

    async def get_user_trips(self, user_id: uuid.UUID) -> list[Trip]:
        return await self.trip_repo.get_by_user(user_id)

    async def get_trip_by_id(self, trip_id: uuid.UUID, user_id: uuid.UUID) -> Trip:
        trip = await self.trip_repo.get_user_trip_by_id(trip_id, user_id)
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        return trip

    async def update_trip(self, trip_id: uuid.UUID, trip_in: TripUpdate, user_id: uuid.UUID) -> Trip:
        # Verify ownership before updating
        trip = await self.get_trip_by_id(trip_id, user_id)
        return await self.trip_repo.update(trip, trip_in)

    async def delete_trip(self, trip_id: uuid.UUID, user_id: uuid.UUID) -> None:
        # Verify ownership before deleting
        trip = await self.get_trip_by_id(trip_id, user_id)
        await self.trip_repo.delete(trip)
