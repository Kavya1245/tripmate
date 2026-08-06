import uuid
from datetime import time
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ItineraryItemCreate(BaseModel):
    trip_id: uuid.UUID
    day_no: int
    activity: str
    time: Optional[time] = None
    notes: Optional[str] = None

class ItineraryItemResponse(ItineraryItemCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
