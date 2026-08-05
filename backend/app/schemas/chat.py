import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ChatRequest(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime
