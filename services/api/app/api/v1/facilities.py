from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from app.models.schemas import Campus, Building, Room, Asset
from app.core.database import repository
from app.core.security import get_current_user, require_permission, AuthenticatedUser

router = APIRouter(prefix="/facilities", tags=["Facilities & Assets"])

@router.get("/campuses", response_model=List[Campus])
def list_campuses():
    return repository.get_campuses()

@router.get("/buildings", response_model=List[Building])
def list_buildings(
    campus_id: str = Query("campus-main-01")
):
    return repository.get_buildings(campus_id)

@router.post("/buildings", response_model=Building, status_code=status.HTTP_201_CREATED)
def create_building(
    building: Building,
    user: AuthenticatedUser = Depends(require_permission("facilities:manage"))
):
    return repository.add_building(building)

@router.get("/rooms", response_model=List[Room])
def list_rooms(
    building_id: str = Query(...)
):
    return repository.get_rooms(building_id)

@router.post("/rooms", response_model=Room, status_code=status.HTTP_201_CREATED)
def create_room(
    room: Room,
    user: AuthenticatedUser = Depends(require_permission("facilities:manage"))
):
    return repository.add_room(room)

@router.get("/assets", response_model=List[Asset])
def list_assets(
    room_id: Optional[str] = Query(None)
):
    return repository.get_assets(room_id)

@router.post("/assets", response_model=Asset, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset: Asset,
    user: AuthenticatedUser = Depends(require_permission("facilities:manage"))
):
    repository.assets[asset.id] = asset
    return asset
