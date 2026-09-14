from fastapi import APIRouter, Query

from app.services.geo_service import find_nearby_vehicles


router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)


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