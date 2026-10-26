from fastapi import APIRouter
from app.api.v1.tickets import router as tickets_router
from app.api.v1.facilities import router as facilities_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.agent import router as agent_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.audit import router as audit_router

api_v1_router = APIRouter()

api_v1_router.include_router(tickets_router)
api_v1_router.include_router(facilities_router)
api_v1_router.include_router(knowledge_router)
api_v1_router.include_router(agent_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(audit_router)
