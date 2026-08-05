from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.core.config import settings
from app.models.chat import ChatMessage
from app.models.user import User

class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = AsyncOpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )

    async def get_chat_history(self, user_id: uuid.UUID) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return result.scalars().all()

    async def send_message(self, user: User, user_message: str) -> ChatMessage:
        # 1. Save user message
        user_msg = ChatMessage(user_id=user.id, role="user", content=user_message)
        self.db.add(user_msg)
        await self.db.commit()
        await self.db.refresh(user_msg)

        # 2. Get chat history for context
        history = await self.get_chat_history(user.id)
        messages = [
            {"role": "system", "content": "You are TripMate, a friendly AI travel concierge. Keep responses concise and helpful."}
        ]
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})

        # 3. Call Groq API (Updated to the new supported model)
        response = await self.client.chat.completions.create(
            model="llama-3.1-8b-instant",  # <--- Changed model name here!
            messages=messages,
            max_tokens=500
        )
        ai_text = response.choices[0].message.content

        # 4. Save AI response
        ai_msg = ChatMessage(user_id=user.id, role="assistant", content=ai_text)
        self.db.add(ai_msg)
        await self.db.commit()
        await self.db.refresh(ai_msg)

        return ai_msg
