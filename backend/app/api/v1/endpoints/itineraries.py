from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.itinerary import ItineraryItem
from app.services.itinerary_service import ItineraryService
from app.schemas.itinerary import ItineraryItemCreate, ItineraryItemResponse
import uuid

router = APIRouter()

# NEW: Get all itinerary items for a specific trip
@router.get("/{trip_id}", response_model=list[ItineraryItemResponse])
async def get_itinerary_items(
    trip_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ItineraryItem).where(ItineraryItem.trip_id == trip_id)
    )
    return result.scalars().all()

@router.post("/", response_model=ItineraryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_itinerary_item(
    item_in: ItineraryItemCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    service = ItineraryService(db)
    return await service.create_item(item_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_itinerary_item(
    item_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    service = ItineraryService(db)
    await service.delete_item(item_id)
    return None
