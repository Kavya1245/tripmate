from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.api.deps import get_current_user
from app.models.user import User
from app.services.cv_service import CVService

router = APIRouter()

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    
    image_bytes = await file.read()
    service = CVService()
    
    try:
        results = service.analyze_image(image_bytes)
        return {"filename": file.filename, "predictions": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
