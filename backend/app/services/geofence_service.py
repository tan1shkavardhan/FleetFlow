import math

from app.redis_client import redis_client
from app.database import AsyncSessionLocal
from app.models.geofence import Geofence
from sqlalchemy import select


GEOFENCE_STATE_PREFIX = "geofence:state"


def calculate_distance_m(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:
    """Calculate distance between two coordinates in metres."""

    earth_radius_m = 6_371_000

    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)

    delta_lat = lat2 - lat1
    delta_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return earth_radius_m * c


async def check_geofences(
    vehicle_id: str,
    latitude: float,
    longitude: float
):
    """Detect vehicle entry into or exit from active geofences."""

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Geofence).where(Geofence.is_active.is_(True))
        )
        geofences = result.scalars().all()

    events = []

    for geofence in geofences:
        distance = calculate_distance_m(
            latitude,
            longitude,
            geofence.latitude,
            geofence.longitude
        )

        is_inside = distance <= geofence.radius_m

        state_key = (
            f"{GEOFENCE_STATE_PREFIX}:"
            f"{vehicle_id}:{geofence.id}"
        )

        previous_state = await redis_client.get(state_key)

        if previous_state is None:
            # Initialize state without generating a false entry event.
            await redis_client.set(
                state_key,
                "inside" if is_inside else "outside"
            )
            continue

        was_inside = previous_state == "inside"

        if is_inside and not was_inside:
            event_type = "ENTER"
        elif not is_inside and was_inside:
            event_type = "EXIT"
        else:
            continue

        await redis_client.set(
            state_key,
            "inside" if is_inside else "outside"
        )

        events.append({
            "event": event_type,
            "vehicle_id": vehicle_id,
            "geofence_id": geofence.id,
            "geofence_name": geofence.name,
            "distance_m": round(distance, 2)
        })

    return events