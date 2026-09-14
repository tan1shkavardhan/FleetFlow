from pydantic import BaseModel, Field 
from datetime import datetime


class VehicleTelemetry(BaseModel):
    vehicle_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(...,ge=-180,le=180)
    speed: float = Field(...,ge=0)
    timestamp: datetime

    