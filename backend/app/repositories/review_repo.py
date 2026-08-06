from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.review import Review
import uuid

class ReviewRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_destination(self, destination_id: uuid.UUID) -> List[Review]:
        result = await self.db.execute(
            select(Review).where(Review.destination_id == destination_id)
        )
        return result.scalars().all()

    async def create(self, review_data: dict) -> Review:
        db_review = Review(**review_data)
        self.db.add(db_review)
        await self.db.commit()
        await self.db.refresh(db_review)
        return db_review
