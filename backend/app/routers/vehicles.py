from fastapi import APIRouter, Depends,Query,HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.geo_service import find_nearby_vehicles
from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.schemas import VehicleCreate
from app.models.telemetry import TelemetryHistory

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)


@router.post("/")
async def create_vehicle(
    data: VehicleCreate,
    db: AsyncSession = Depends(get_db)
):
    if data.current_load_kg > data.capacity_kg:
        return {
            "error": "Current load cannot exceed vehicle capacity"
        }

    vehicle = Vehicle(
        vehicle_id=data.vehicle_id,
        status="ACTIVE",
        capacity_kg=data.capacity_kg,
        current_load_kg=data.current_load_kg
    )

    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)

    return {
        "vehicle_id":vehicle.vehicle_id,
        "status":vehicle.status,
        "capacity_kg":vehicle.capacity_kg,
        "current_load_kg": vehicle.current_load_kg
        }


@router.get("/nearby")
async def get_nearby_vehicles(
    longitude: float = Query(...),
    latitude: float = Query(...),
    radius_km: float = Query(5)
):

    vehicles = await find_nearby_vehicles(
        longitude=longitude,
        latitude=latitude,
        radius_km=radius_km
    )

    formatted_vehicles = []

    for vehicle_id, distance in vehicles:
        formatted_vehicles.append({
            "vehicle_id": vehicle_id,
            "distance_km": float(distance)
        })

    return {
        "count": len(formatted_vehicles),
        "vehicles": formatted_vehicles
    }


@router.get("/{vehicle_id}/history")
async def get_vehicle_history(
    vehicle_id: str,
    limit: int = Query(default=100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(TelemetryHistory)
        .where(TelemetryHistory.vehicle_id == vehicle_id)
        .order_by(TelemetryHistory.timestamp.asc())
        .limit(limit)
    )

    result = await db.execute(query)
    records = result.scalars().all()

    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"No telemetry history found for vehicle {vehicle_id}"
        )

    history = [
        {
            "latitude": record.latitude,
            "longitude": record.longitude,
            "speed": record.speed,
            "timestamp": record.timestamp.isoformat()
        }
        for record in records
    ]

    return {
        "vehicle_id": vehicle_id,
        "count": len(history),
        "history": history
    }