from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.ml_service import MLRecommenderService

router = APIRouter()

class RecommendationRequest(BaseModel):
    budget: float
    tags: str
    duration: int = 5
    travel_style: str = "Balanced"

@router.post("/recommend")
async def get_recommendations(
    req: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = MLRecommenderService(db)
    recommendations = await service.recommend(req.budget, req.tags, req.duration, req.travel_style)
    return {"user_budget": req.budget, "recommendations": recommendations}
