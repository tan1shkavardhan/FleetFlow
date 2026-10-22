from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    vehicle_id: Mapped[str] = mapped_column(
        String,
        primary_key=True
    )

    status: Mapped[str] = mapped_column(
        String,
        default="ACTIVE"
    )

    capacity_kg: Mapped[float] = mapped_column(
        Float
    )

    current_load_kg: Mapped[float] = mapped_column(
        Float,
        default=0
    )