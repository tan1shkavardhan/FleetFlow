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
    radius_km: float
):
    vehicles = await redis_client.georadius(
        VEHICLE_GEO_KEY,
        longitude,
        latitude,
        radius_km,
        unit="km",
        withdist=True
    )

    return vehicles