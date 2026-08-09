import uuid
from pydantic import BaseModel, ConfigDict

class DestinationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    country: str
    description: str | None
    tags: str | None
    image_url: str | None
    avg_budget: float | None
    wiki_url: str | None = None
    external_rating: float | None = None
    external_reviews_count: int | None = None
