from fastapi import APIRouter

from app.models.schemas import VehicleTelemetry
from app.services.geo_service import update_vehicle_location

router = APIRouter(
    prefix="/telemetry",
    tags=["Telemetry"]
)

@router.post("/")
async def receive_telemetry(data:VehicleTelemetry):

    await update_vehicle_location(
        vehicle_id=data.vehicle_id,
        longitude=data.longitude,
        latitude=data.latitude
    )

    return {
        "status":"success",
        "message":"Vehicle telemetry received",
        "vehicle_id":data.vehicle_id
    }

