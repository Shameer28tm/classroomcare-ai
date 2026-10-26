from fastapi import APIRouter, Depends, Query
from typing import List
from app.models.schemas import Notification
from app.core.database import repository
from app.core.security import get_current_user, AuthenticatedUser

router = APIRouter(prefix="/notifications", tags=["Notification Center"])

@router.get("", response_model=List[Notification])
def list_notifications(
    campus_id: str = Query("campus-main-01"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    notifs = [n for n in repository.notifications if n.campus_id == campus_id]
    return sorted(notifs, key=lambda x: x.created_at, reverse=True)

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    for n in repository.notifications:
        if n.id == notification_id:
            n.read = True
            return {"status": "success", "id": notification_id, "read": True}
    return {"status": "not_found"}
