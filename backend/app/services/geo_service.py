from app.redis_client import redis_client


VEHICLE_GEO_KEY = "vehicles:locations"


async def update_vehicle_location(
    vehicle_id: str,
    longitude: float,
    latitude: float
):
    await redis_client.geoadd(
        VEHICLE_GEO_KEY,
        (
            longitude,
            latitude,
            vehicle_id
        )
    )


async def find_nearby_vehicles(
    longitude: float,
    latitude: float,
    radius_km: float,
    exclude_vehicle_id: str | None = None
):
    vehicles = await redis_client.georadius(
        VEHICLE_GEO_KEY,
        longitude,
        latitude,
        radius_km,
        unit="km",
        withdist=True
    )

    nearby_vehicles = []

    for vehicle_id, distance in vehicles:

        if vehicle_id == exclude_vehicle_id:
            continue

        nearby_vehicles.append(
            (vehicle_id, distance)
        )

    return nearby_vehicles