import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ReviewCreate(BaseModel):
    destination_id: uuid.UUID
    rating: int
    comment: str | None = None

class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None = None # Added user_name field
    rating: int
    comment: str | None = None
    created_at: datetime
