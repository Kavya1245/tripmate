import uuid
from pydantic import BaseModel, ConfigDict

class ItineraryItemCreate(BaseModel):
    trip_id: uuid.UUID
    day_no: int
    activity: str
    time: str | None = None
    notes: str | None = None

class ItineraryItemUpdate(BaseModel):
    day_no: int | None = None
    activity: str | None = None
    time: str | None = None
    notes: str | None = None

class ItineraryItemResponse(ItineraryItemCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
