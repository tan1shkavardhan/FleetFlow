from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.redis_client import redis_client
from app.routers import telemetry, vehicles, websocket
from app.database import Base, engine
from app.models.vehicle import Vehicle
from app.models.telemetry import TelemetryHistory
from app.models.geofence import Geofence
from app.routers import geofences

app = FastAPI(
    title="FleetFlow",
    description="Smart Resilient Routing"
)

# Allow requests from the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(telemetry.router)
app.include_router(vehicles.router)
app.include_router(websocket.router)
app.include_router(geofences.router)


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


@app.on_event("startup")
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)