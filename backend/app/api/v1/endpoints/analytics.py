from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.trip import Trip
from app.models.destination import Destination
from app.models.user import User
from app.api.deps import get_current_user
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/stats")
async def get_analytics_stats(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # 🔒 STRICT ROLE CHECK: Only admins can view platform analytics
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required to view analytics.")

    # Core Counts
    total_users = (await db.execute(select(func.count(UserModel.id)))).scalar_one()
    total_trips = (await db.execute(select(func.count(Trip.id)))).scalar_one()
    total_destinations = (await db.execute(select(func.count(Destination.id)))).scalar_one()
    
    # Financial ETL
    total_budget = (await db.execute(select(func.sum(Trip.budget)))).scalar_one() or 0.0
    avg_budget = (await db.execute(select(func.avg(Trip.budget)))).scalar_one() or 0.0
    
    # Categorical ETL
    status_counts = (await db.execute(
        select(Trip.status, func.count(Trip.id)).group_by(Trip.status)
    )).all()
    
    all_trips = (await db.execute(select(Trip.budget))).scalars().all()
    budget_tiers = {"Economy (<$1000)": 0, "Mid-range ($1000-$2000)": 0, "Luxury (>$2000)": 0}
    for budget in all_trips:
        if budget < 1000: budget_tiers["Economy (<$1000)"] += 1
        elif budget <= 2000: budget_tiers["Mid-range ($1000-$2000)"] += 1
        else: budget_tiers["Luxury (>$2000)"] += 1

    popular_titles = (await db.execute(
        select(Trip.title, func.count(Trip.id)).group_by(Trip.title).order_by(func.count(Trip.id).desc()).limit(5)
    )).all()

    return {
        "kpis": {
            "total_users": total_users,
            "total_trips": total_trips,
            "total_destinations": total_destinations,
            "total_platform_budget": float(total_budget),
            "avg_trip_budget": float(avg_budget)
        },
        "trips_by_status": [{"name": s, "value": c} for s, c in status_counts],
        "budget_tiers": [{"name": k, "value": v} for k, v in budget_tiers.items()],
        "popular_destinations": [{"name": t, "trips": c} for t, c in popular_titles]
    }
