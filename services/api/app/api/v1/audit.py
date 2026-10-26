from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.models.schemas import AuditLog
from app.core.database import repository
from app.core.security import get_current_user, require_permission, AuthenticatedUser

router = APIRouter(prefix="/audit", tags=["Audit & Governance"])

@router.get("/logs", response_model=List[AuditLog])
def list_audit_logs(
    campus_id: str = Query("campus-main-01"),
    entity_type: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(require_permission("audit:view_safety"))
):
    logs = [l for l in repository.audit_logs if l.campus_id == campus_id]
    if entity_type:
        logs = [l for l in logs if l.entity_type == entity_type]
    return sorted(logs, key=lambda x: x.created_at, reverse=True)
