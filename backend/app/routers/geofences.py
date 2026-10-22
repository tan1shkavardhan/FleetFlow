from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.geofence import Geofence


router = APIRouter(
    prefix="/geofences",
    tags=["Geofences"]
)


class GeofenceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_m: float = Field(..., gt=0)


@router.post("/")
async def create_geofence(
    data: GeofenceCreate,
    db: AsyncSession = Depends(get_db)
):
    geofence = Geofence(
        name=data.name,
        latitude=data.latitude,
        longitude=data.longitude,
        radius_m=data.radius_m
    )

    db.add(geofence)
    await db.commit()
    await db.refresh(geofence)

    return {
        "message": "Geofence created",
        "id": geofence.id,
        "name": geofence.name,
        "latitude": geofence.latitude,
        "longitude": geofence.longitude,
        "radius_m": geofence.radius_m
    }


@router.get("/")
async def list_geofences(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Geofence).order_by(Geofence.id)
    )

    geofences = result.scalars().all()

    return {
        "count": len(geofences),
        "geofences": [
            {
                "id": item.id,
                "name": item.name,
                "latitude": item.latitude,
                "longitude": item.longitude,
                "radius_m": item.radius_m,
                "is_active": item.is_active
            }
            for item in geofences
        ]
    }


@router.get("/{geofence_id}")
async def get_geofence(
    geofence_id: int,
    db: AsyncSession = Depends(get_db)
):
    geofence = await db.get(Geofence, geofence_id)

    if geofence is None:
        raise HTTPException(
            status_code=404,
            detail="Geofence not found"
        )

    return {
        "id": geofence.id,
        "name": geofence.name,
        "latitude": geofence.latitude,
        "longitude": geofence.longitude,
        "radius_m": geofence.radius_m,
        "is_active": geofence.is_active
    }