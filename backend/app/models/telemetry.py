from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TelemetryHistory(Base):

    __tablename__ = "telemetry_history"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    vehicle_id: Mapped[str] = mapped_column(
        String,
        index=True
    )

    latitude: Mapped[float] = mapped_column(
        Float
    )

    longitude: Mapped[float] = mapped_column(
        Float
    )

    speed: Mapped[float] = mapped_column(
        Float
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        index=True
    )