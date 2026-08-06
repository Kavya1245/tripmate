from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.review import Review
from app.models.user import User
import uuid

class ReviewRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_destination(self, destination_id: uuid.UUID) -> List[dict]:
        # Join Review and User tables to get the user's name
        result = await self.db.execute(
            select(Review, User.first_name, User.last_name)
            .join(User, Review.user_id == User.id)
            .where(Review.destination_id == destination_id)
            .order_by(Review.created_at.desc())
        )
        rows = result.all()
        
        # Format the result into dictionaries that match the schema
        return [
            {
                "id": rev.id,
                "user_id": rev.user_id,
                "user_name": f"{first_name} {last_name}",
                "rating": rev.rating,
                "comment": rev.comment,
                "created_at": rev.created_at
            }
            for rev, first_name, last_name in rows
        ]

    async def create(self, review_data: dict) -> Review:
        db_review = Review(**review_data)
        self.db.add(db_review)
        await self.db.commit()
        await self.db.refresh(db_review)
        return db_review
