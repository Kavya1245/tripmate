from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user import UserCreate
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User, UserCreate]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    # Override base create to map 'password' to 'hashed_password'
    async def create(self, obj_in: UserCreate) -> User:
        db_obj = User(
            name=obj_in.name,
            email=obj_in.email,
            hashed_password=obj_in.password # Mapping the field
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj
