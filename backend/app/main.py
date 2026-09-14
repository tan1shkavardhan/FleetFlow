from fastapi import FastAPI

from app.redis_client import redis_client
from app.routers import telemetry, vehicles


app = FastAPI(
    title="FleetFlow",
    description="Smart Resilient Routing"
)

app.include_router(telemetry.router)
app.include_router(vehicles.router)

@app.get("/")
async def root():
    return {"message": "FleetFlow is running"}


@app.get("/redis-test")
async def redis_test():
    await redis_client.set("fleetflow_test", "Redis connected!")

    value = await redis_client.get("fleetflow_test")

    return {
        "message": value
    }

