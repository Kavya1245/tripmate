from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.review_service import ReviewService
from app.schemas.review import ReviewCreate, ReviewResponse
import uuid

router = APIRouter()

@router.get("/{destination_id}", response_model=list[ReviewResponse])
async def get_reviews(destination_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = ReviewService(db)
    return await service.get_reviews_for_destination(destination_id)

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    service = ReviewService(db)
    return await service.create_review(review_in, current_user.id)
