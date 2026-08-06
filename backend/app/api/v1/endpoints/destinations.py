from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.destination_service import DestinationService
from app.schemas.destination import DestinationResponse
import uuid

router = APIRouter()

# ADDED PAGINATION (skip & limit)
@router.get("/", response_model=list[DestinationResponse])
async def get_destinations(
    skip: int = Query(0, ge=0), 
    limit: int = Query(10, ge=1, le=100), 
    db: AsyncSession = Depends(get_db)
):
    service = DestinationService(db)
    return await service.get_all_destinations(skip=skip, limit=limit)

@router.get("/{destination_id}", response_model=DestinationResponse)
async def get_destination(destination_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = DestinationService(db)
    dest = await service.get_destination(destination_id)
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    return dest

@router.post("/seed-external")
async def seed_external_destinations(db: AsyncSession = Depends(get_db)):
    service = DestinationService(db)
    added_count = await service.fetch_and_seed_external()
    return {"message": f"Successfully fetched and added {added_count} new destinations!"}
