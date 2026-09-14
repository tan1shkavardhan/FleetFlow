from app.redis_client import redis_client

TELEMETRY_HISTORY_SIZE = 5

def get_speed_history_key(vehicle_id: str) -> str:
    return f"vehicle:{vehicle_id}:speed_history"


async def store_speed(
        vehicle_id: str,
        speed: float
):