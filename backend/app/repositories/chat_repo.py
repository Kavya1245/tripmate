from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chat import ChatMessage
import uuid

class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_history_by_user(self, user_id: uuid.UUID) -> List[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return result.scalars().all()

    async def create(self, msg_data: dict) -> ChatMessage:
        db_msg = ChatMessage(**msg_data)
        self.db.add(db_msg)
        await self.db.commit()
        await self.db.refresh(db_msg)
        return db_msg
