from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_v1_router
from datetime import datetime, timezone

def create_application() -> FastAPI:
    app = FastAPI(
        title="ClassroomCare AI Platform API",
        description="Autonomous Classroom Maintenance Management, Deterministic Safety Triage, and LangGraph Agent API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Security headers middleware
    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    from app.core.supabase import SupabaseBackendStatus
    from app.core.gemini_diagnostics import GeminiDiagnostics
    from app.core.institution import niu_institution_config

    # Health and Readiness Endpoints
    @app.get("/health", tags=["System Health"])
    def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "institution": niu_institution_config.institution_name,
            "campus": niu_institution_config.campus_name,
            "campus_code": niu_institution_config.campus_code,
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    @app.get("/readiness", tags=["System Health"])
    def readiness_check():
        sb_status = SupabaseBackendStatus.get_status()
        gemini_status = GeminiDiagnostics.get_status(test_live=False)
        return {
            "status": "ready",
            "llm_provider": settings.LLM_PROVIDER,
            "embedding_provider": settings.EMBEDDING_PROVIDER,
            "supabase": sb_status,
            "gemini": gemini_status,
            "demo_fixtures_active": settings.ENABLE_DEMO_DATA,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    @app.get("/supabase-status", tags=["System Health"])
    def supabase_status():
        return SupabaseBackendStatus.get_status()

    @app.get("/gemini-status", tags=["System Health"])
    def gemini_status(test_live: bool = False):
        return GeminiDiagnostics.get_status(test_live=test_live)

    @app.get("/", tags=["System Health"])
    def root():
        return {
            "message": "Welcome to ClassroomCare AI API",
            "docs": "/docs",
            "health": "/health",
            "api_v1": settings.API_V1_PREFIX
        }

    # Mount API v1
    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    return app

app = create_application()
