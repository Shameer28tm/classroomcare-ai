from fastapi import APIRouter, Depends, Query
from app.models.schemas import AnalyticsOverview
from app.core.database import repository
from app.core.security import get_current_user, AuthenticatedUser

router = APIRouter(prefix="/analytics", tags=["Operational Analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    campus_id: str = Query("campus-main-01"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    return repository.get_analytics(campus_id)
