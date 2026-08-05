from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.chat_service import ChatService
from app.schemas.chat import ChatRequest, ChatMessageResponse

router = APIRouter()

@router.get("/history", response_model=list[ChatMessageResponse])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ChatService(db)
    return await service.get_chat_history(current_user.id)

@router.post("/", response_model=ChatMessageResponse)
async def send_message(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ChatService(db)
    return await service.send_message(current_user, req.message)
