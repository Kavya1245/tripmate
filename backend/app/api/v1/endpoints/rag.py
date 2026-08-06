from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.rag_service import RagService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

class DocumentIn(BaseModel):
    doc_id: str
    text: str
    country: str

@router.post("/seed")
async def seed_document(
    doc_in: DocumentIn, 
    current_user: User = Depends(get_current_user)
):
    service = RagService()
    service.add_document(
        doc_id=doc_in.doc_id, 
        text=doc_in.text, 
        metadata={"country": doc_in.country}
    )
    return {"message": "Document added to vector database successfully!"}
