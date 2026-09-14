from datetime import datetime
from app.redis_client import redis_client

DELAY_THRESHOLD = 0.4
CONSECUTIVE_ALERT_LIMIT = 3

def get_expected_speed() -> float:
    hour = datetime.now().hour

    #morning rush hour
    if 8 <= hour < 11:
        return 25.0

    #evening rush hour
    elif 17 <= hour < 21:
        return 20.0

    #normal traffic conditions
    return 40.0


def calculate_speed_ratio(
        actual_speed: float,
        expected_speed:float
) -> float:

    if expected_speed == 0:
        return 1.0

    return actual_speed / expected_speed

async def is_delayed(
        vehicle_id: str,actual_speed: float
) -> bool:

    expected_speed = get_expected_speed()

    speed_ratio = calculate_speed_ratio(
        actual_speed,
        expected_speed
    )

    alert_key = f"vehicle:{vehicle_id}:delay_alerts"

    current_alerts = await redis_client.get(alert_key) 

    if current_alerts is None:
        current_alerts = 0
    else:
        current_alerts = int(current_alerts)

    if speed_ratio <= DELAY_THRESHOLD:
        current_alerts += 1

        await redis_client.set(
            alert_key,
            current_alerts
        )

    else:

        current_alerts = 0

        await redis_client.set(
            alert_key,
            0
        )

    return current_alerts >= CONSECUTIVE_ALERT_LIMIT
