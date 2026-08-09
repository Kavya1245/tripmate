from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.destination_service import DestinationService
from app.schemas.destination import DestinationResponse
from pydantic import BaseModel
import uuid

router = APIRouter()

class ExternalDestCreate(BaseModel):
    name: str
    country: str = "Global"
    description: str | None = None
    image_url: str | None = None
    tags: str | None = None
    avg_budget: float | None = 1500.0

@router.get("/", response_model=list[DestinationResponse])
async def get_destinations(
    q: str | None = Query(None, description="Search query for live Wikipedia results"),
    skip: int = Query(0, ge=0), 
    limit: int = Query(10, ge=1, le=100), 
    db: AsyncSession = Depends(get_db)
):
    service = DestinationService(db)
    if q:
        return await service.search_external(q)
    return await service.get_all_destinations(skip=skip, limit=limit)

@router.get("/{destination_id}", response_model=DestinationResponse)
async def get_destination(destination_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = DestinationService(db)
    dest = await service.get_destination(destination_id)
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    return dest

# NEW: Endpoint to save a live search result to the DB so it can have reviews/details
@router.post("/save", response_model=DestinationResponse)
async def save_destination(dest_in: ExternalDestCreate, db: AsyncSession = Depends(get_db)):
    service = DestinationService(db)
    return await service.save_destination(dest_in.model_dump())

@router.post("/seed-external")
async def seed_external_destinations(db: AsyncSession = Depends(get_db)):
    service = DestinationService(db)
    added_count = await service.fetch_and_seed_external()
    return {"message": f"Successfully fetched and added {added_count} new destinations!"}
