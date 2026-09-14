from datetime import datetime

DELAY_THRESHOLD = 0.4
CONSECUTIVE_ALERT_LIMIT = 3

def get_expected_speed() -> float:
    """
    Returns expected vehicle speed based on the current hour.
    This is a simplified time-dependent traffic model.
    """

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

