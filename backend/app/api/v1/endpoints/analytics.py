from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.trip import Trip
from app.models.destination import Destination
from app.models.user import User
from app.models.review import Review
from app.api.deps import get_current_user
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/stats")
async def get_analytics_stats(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Any logged-in user can view analytics
    total_users = (await db.execute(select(func.count(UserModel.id)))).scalar_one()
    total_trips = (await db.execute(select(func.count(Trip.id)))).scalar_one()
    total_destinations = (await db.execute(select(func.count(Destination.id)))).scalar_one()
    total_reviews = (await db.execute(select(func.count(Review.id)))).scalar_one()
    
    total_budget = (await db.execute(select(func.sum(Trip.budget)))).scalar_one() or 0.0
    avg_budget = (await db.execute(select(func.avg(Trip.budget)))).scalar_one() or 0.0
    
    status_counts = (await db.execute(
        select(Trip.status, func.count(Trip.id)).group_by(Trip.status)
    )).all()
    
    budget_tiers = {"Economy (<$1000)": 0, "Mid-range ($1000-$2000)": 0, "Luxury (>$2000)": 0}
    
    all_trips_rows = (await db.execute(select(Trip))).scalars().all()
    budget_vs_duration = []
    trips_timeline = {}
    
    for trip in all_trips_rows:
        duration = (trip.end_date - trip.start_date).days + 1
        budget_vs_duration.append({"x": duration, "y": float(trip.budget), "z": duration * float(trip.budget)})
        
        if trip.budget < 1000: budget_tiers["Economy (<$1000)"] += 1
        elif trip.budget <= 2000: budget_tiers["Mid-range ($1000-$2000)"] += 1
        else: budget_tiers["Luxury (>$2000)"] += 1
        
        if trip.created_at:
            month_year = trip.created_at.strftime("%Y-%m")
            trips_timeline[month_year] = trips_timeline.get(month_year, 0) + 1

    sorted_timeline = [{"date": k, "trips": v} for k, v in sorted(trips_timeline.items())]
    popular_titles = (await db.execute(
        select(Trip.title, func.count(Trip.id)).group_by(Trip.title).order_by(func.count(Trip.id).desc()).limit(5)
    )).all()

    return {
        "kpis": {
            "total_users": total_users, "total_trips": total_trips,
            "total_destinations": total_destinations, "total_reviews": total_reviews,
            "total_platform_budget": float(total_budget), "avg_trip_budget": float(avg_budget)
        },
        "trips_by_status": [{"name": s, "value": c} for s, c in status_counts],
        "budget_tiers": [{"name": k, "value": v} for k, v in budget_tiers.items()],
        "popular_destinations": [{"name": t, "trips": c} for t, c in popular_titles],
        "budget_vs_duration": budget_vs_duration,
        "trips_timeline": sorted_timeline
    }
