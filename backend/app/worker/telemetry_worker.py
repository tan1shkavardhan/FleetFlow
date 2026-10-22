import asyncio
import logging

from redis.exceptions import ResponseError
from datetime import datetime

from app.redis_client import redis_client
from app.database import AsyncSessionLocal
from app.models.telemetry import TelemetryHistory


STREAM_KEY = "telemetry:stream"
GROUP_NAME = "telemetry-workers"
CONSUMER_NAME = "worker-1"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_consumer_group():
    try:
        await redis_client.xgroup_create(
            name=STREAM_KEY,
            groupname=GROUP_NAME,
            id="0",
            mkstream=True
        )
        logger.info("Redis consumer group created")

    except ResponseError as error:
        if "BUSYGROUP" in str(error):
            logger.info("Redis consumer group already exists")
        else:
            raise


async def save_telemetry(fields: dict):
    async with AsyncSessionLocal() as session:
        record = TelemetryHistory(
            vehicle_id=fields["vehicle_id"],
            latitude=float(fields["latitude"]),
            longitude=float(fields["longitude"]),
            speed=float(fields["speed"]),
            timestamp=datetime.fromisoformat(fields["timestamp"]).replace(
                tzinfo=None
)
        )

        session.add(record)
        await session.commit()


async def process_events(events):
    for stream_name, messages in events:
        for message_id, fields in messages:
            try:
                await save_telemetry(fields)

                await redis_client.xack(
                    STREAM_KEY,
                    GROUP_NAME,
                    message_id
                )

                logger.info(
                    "Saved telemetry for %s",
                    fields["vehicle_id"]
                )

            except Exception:
                logger.exception(
                    "Failed to process event %s",
                    message_id
                )


async def main():
    await create_consumer_group()

    logger.info("Telemetry worker started")

    while True:
        events = await redis_client.xreadgroup(
            groupname=GROUP_NAME,
            consumername=CONSUMER_NAME,
            streams={STREAM_KEY: ">"},
            count=10,
            block=5000
        )

        if events:
            await process_events(events)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    finally:
        asyncio.run(redis_client.aclose())