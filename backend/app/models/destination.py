import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class Destination(Base):
    __tablename__ = "destinations"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(2000), nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    avg_budget: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("idx_destination_country", "country"),)
