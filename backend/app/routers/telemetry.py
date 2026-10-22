from fastapi import APIRouter

from app.models.schemas import VehicleTelemetry
from app.services.geo_service import (
    update_vehicle_location,
    find_nearby_vehicles
)
from app.services.delay_detector import is_delayed
from app.services.websocket_manager import manager
from app.services.telemetry_service import publish_telemetry
from app.services.geofence_service import check_geofences


router = APIRouter(
    prefix="/telemetry",
    tags=["Telemetry"]
)


@router.post("/")
async def receive_telemetry(data: VehicleTelemetry):

    await update_vehicle_location(
        vehicle_id=data.vehicle_id,
        longitude=data.longitude,
        latitude=data.latitude
    )

    geofence_events = await check_geofences(
    vehicle_id=data.vehicle_id,
    latitude=data.latitude,
    longitude=data.longitude
)

    for event in geofence_events:
        await manager.broadcast({
            "type": "geofence_alert",
            **event
        })

    await publish_telemetry(
    vehicle_id=data.vehicle_id,
    latitude=data.latitude,
    longitude=data.longitude,
    speed=data.speed
)

    await manager.broadcast({
        "vehicle_id": data.vehicle_id,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "speed": data.speed
    })

    delayed = await is_delayed(
        vehicle_id=data.vehicle_id,
        actual_speed=data.speed
    )

    nearby_vehicles = []

    if delayed:

        vehicles = await find_nearby_vehicles(
            longitude=data.longitude,
            latitude=data.latitude,
            radius_km=5,
            exclude_vehicle_id=data.vehicle_id
        )

        for vehicle_id, distance in vehicles:
            nearby_vehicles.append({
                "vehicle_id": vehicle_id,
                "distance_km": float(distance)
            })

    return {
        "status": "success",
        "message": "Vehicle telemetry received",
        "vehicle_id": data.vehicle_id,
        "delayed": delayed,
        "nearby_vehicles": nearby_vehicles,
        "geofence_events": geofence_events,
    }