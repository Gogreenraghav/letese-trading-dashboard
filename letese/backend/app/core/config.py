"""
LETESE● Core Configuration
All settings driven by environment variables.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "LETESE● Legal SaaS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://letese_user:password@localhost:5432/letese_prod"
    PGBOUNCER_URL: str = "postgresql+asyncpg://letese_user:password@localhost:6432/letese_prod"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"

    # JWT (RS256 — paths to keys loaded at runtime)
    JWT_ALGORITHM: str = "RS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AWS S3
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET_DOCS: str = "letese-tenant-docs-prod"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    # Third-party API Keys (set via env vars in production)
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    WHATSAPP_API_KEY: str = ""
    MSG91_AUTH_KEY: str = ""
    EXOTEL_API_KEY: str = ""
    EXOTEL_API_TOKEN: str = ""
    ELEVENLABS_API_KEY: str = ""

    # Feature Flags
    WHATSAPP_ENABLED: bool = True
    AI_VOICE_CALLS_ENABLED: bool = False
    OLLAMA_ENABLED: bool = False
    OLLAMA_BASE_URL: str = "http://mac-mini-m4:11434"

    # Plan Limits
    MAX_FREE_CASES: int = 30
    MAX_FREE_STORAGE_GB: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
