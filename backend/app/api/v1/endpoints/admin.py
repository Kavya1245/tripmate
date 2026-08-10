from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.admin_service import AdminService

router = APIRouter()

@router.get("/data")
async def get_admin_data(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Any logged-in user can view database tables
    service = AdminService(db)
    return await service.get_platform_data()
