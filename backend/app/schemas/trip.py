import uuid
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

class TripBase(BaseModel):
    title: str
    start_date: date
    end_date: date
    budget: float | None = None
    status: str = "planning"

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    title: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    budget: float | None = None
    status: str | None = None

class TripResponse(TripBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
