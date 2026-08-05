from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.trip_service import TripService
from app.schemas.trip import TripCreate, TripUpdate, TripResponse

router = APIRouter()

@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_in: TripCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    service = TripService(db)
    return await service.create_trip(trip_in, current_user.id)

@router.get("/", response_model=list[TripResponse])
async def get_trips(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    service = TripService(db)
    return await service.get_user_trips(current_user.id)

@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: str, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    service = TripService(db)
    return await service.get_trip_by_id(trip_id, current_user.id)

@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str, 
    trip_in: TripUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    service = TripService(db)
    return await service.update_trip(trip_id, trip_in, current_user.id)

@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: str, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    service = TripService(db)
    await service.delete_trip(trip_id, current_user.id)
    return None
