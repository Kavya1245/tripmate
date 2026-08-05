from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def signup_user(self, user_in: UserCreate) -> User:
        existing_user = await self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        hashed_password = get_password_hash(user_in.password)
        db_user = await self.user_repo.create(
            UserCreate(name=user_in.name, email=user_in.email, password=hashed_password)
        )
        return db_user

    async def login_user(self, user_in: UserLogin) -> str:
        user = await self.user_repo.get_by_email(user_in.email)
        if not user or not verify_password(user_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token = create_access_token(data={"sub": user.email})
        return access_token
