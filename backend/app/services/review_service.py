from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.review_repo import ReviewRepository
from app.schemas.review import ReviewCreate
import uuid

class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.review_repo = ReviewRepository(db)

    async def get_reviews_for_destination(self, destination_id: uuid.UUID):
        return await self.review_repo.get_by_destination(destination_id)

    async def create_review(self, review_in: ReviewCreate, user_id: uuid.UUID):
        review_data = review_in.model_dump()
        review_data["user_id"] = user_id
        return await self.review_repo.create(review_data)
