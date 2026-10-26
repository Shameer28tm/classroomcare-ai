from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
import os
from pathlib import Path

# Find root .env file if available
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_ENV = BASE_DIR.parent.parent / ".env"

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")
    APP_NAME: str = Field(default="ClassroomCare AI — NIU Facilities & Campus Operations")
    API_V1_PREFIX: str = Field(default="/api/v1")
    SECRET_KEY: str = Field(default="dev-secret-key-at-least-32-chars-long-classroomcare")
    
    # Server
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "https://classroomcare-ai.vercel.app",
        ]
    )
    
    # Supabase / Database
    SUPABASE_URL: str = Field(default="")
    SUPABASE_ANON_KEY: str = Field(default="")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="")
    DATABASE_URL: str = Field(default="")
    
    # LLM & Embeddings
    LLM_PROVIDER: str = Field(default="mock") # "gemini" or "mock"
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-1.5-flash")
    EMBEDDING_PROVIDER: str = Field(default="mock") # "gemini" or "mock"
    EMBEDDING_MODEL: str = Field(default="text-embedding-004")
    EMBEDDING_DIMENSION: int = Field(default=768)
    
    # RAG Settings
    RAG_SIMILARITY_THRESHOLD: float = Field(default=0.65)
    RAG_MAX_RESULTS: int = Field(default=5)
    RAG_MAX_REPLAN_ATTEMPTS: int = Field(default=2)
    
    # Safety & Emergencies
    EMERGENCY_CONTACT_PHONE: str = Field(default="(+91) 4651-250 566 / 112 (Local/National Emergency)")
    EMERGENCY_EHS_EMAIL: str = Field(default="info@niuniv.com")
    ENABLE_DEMO_DATA: bool = Field(default=True)

    class Config:
        env_file = str(ROOT_ENV) if ROOT_ENV.exists() else ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
