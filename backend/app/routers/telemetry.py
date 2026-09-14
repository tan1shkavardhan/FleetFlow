from fastapi import APIRouter

from app.models.schemas import VehicleTelemetry
from app.services.geo_service import (
    update_vehicle_location,
    find_nearby_vehicles
)
from app.services.delay_detector import is_delayed
from datetime import datetime
from zoneinfo import ZoneInfo


router = APIRouter(
    prefix="/telemetry",
    tags=["Telemetry"]
)

@router.post("/")
async def receive_telemetry(data:VehicleTelemetry):

    timestamp = datetime.now(ZoneInfo("Asia/Kolkata"))

    await update_vehicle_location(
        vehicle_id=data.vehicle_id,
        longitude=data.longitude,
        latitude=data.latitude
    )

    delayed = await is_delayed(
        vehicle_id= data.vehicle_id,
        actual_speed=data.speed
    )

    if delayed:
        nearby_vehicles = await find_nearby_vehicles(
            longitude=data.longitude,
            latitude=data.latitude,
            radius_km=5,
            exclude_vehicle_id=data.vehicle_id
        )

    return {
        "status":"success",
        "message":"Vehicle telemetry received",
        "vehicle_id":data.vehicle_id,
        "delayed":delayed,
        "nearby_vehicles": nearby_vehicles if delayed else []
    }

