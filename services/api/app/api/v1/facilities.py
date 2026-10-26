from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional
from app.models.schemas import Campus, Building, Room, Asset
from app.core.database import repository
from app.core.security import get_current_user, require_permission, verify_campus_isolation, AuthenticatedUser

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
    verify_campus_isolation(building.campus_id, user)

    # Duplicate check on Code or ID within campus
    existing_buildings = repository.get_buildings(building.campus_id)
    for b in existing_buildings:
        if b.id == building.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Building with identifier '{building.id}' already exists."
            )
        if b.code.strip().upper() == building.code.strip().upper():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Building with code '{building.code}' already exists in campus '{building.campus_id}'."
            )

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
    verify_campus_isolation(room.campus_id, user)

    # Verify parent building exists in the same campus
    buildings = repository.get_buildings(room.campus_id)
    bld_match = next((b for b in buildings if b.id == room.building_id), None)
    if not bld_match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parent building '{room.building_id}' not found in campus '{room.campus_id}'."
        )

    # Duplicate check for room number in the same building
    existing_rooms = repository.get_rooms(room.building_id)
    for r in existing_rooms:
        if r.room_number.strip().upper() == room.room_number.strip().upper():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Room '{room.room_number}' already exists in building '{bld_match.name}'."
            )

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
