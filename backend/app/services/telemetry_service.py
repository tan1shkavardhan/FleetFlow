from datetime import datetime, timezone

from app.redis_client import redis_client


TELEMETRY_STREAM_KEY = "telemetry:stream"


async def publish_telemetry(
    vehicle_id: str,
    latitude: float,
    longitude: float,
    speed: float
):
    event = {
        "vehicle_id": vehicle_id,
        "latitude": str(latitude),
        "longitude": str(longitude),
        "speed": str(speed),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    stream_id = await redis_client.xadd(
        TELEMETRY_STREAM_KEY,
        event
    )

    return stream_id