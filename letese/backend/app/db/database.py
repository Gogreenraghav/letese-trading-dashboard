"""
LETESE● Database Connection & Session Management
Uses SQLAlchemy 2.0 async with connection pooling.
"""
from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def set_tenant_context(conn, tenant_id: str, role: str = "user"):
    """Set PostgreSQL RLS context for tenant isolation."""
    await conn.execute(
        text(f"SET LOCAL app.current_tenant_id = '{tenant_id}'")
    )
    await conn.execute(
        text(f"SET LOCAL app.role = '{role}'")
    )


# ─── Synchronous convenience wrappers (for use outside async context) ────────

def sync_create_all() -> None:
    """Synchronous wrapper: create all tables defined in ORM models.

    Uses the sync engine internally. Safe to call at startup
    when Alembic migrations have not yet been run.
    """
    from app.models.models import (
        Tenant, User, Case, CaseHearing, CommunicationLog,
        Document, Task, Invoice, AuditLog, CourtChecklist,
        VendorConfig, LLMUsageLog,
    )
    import warnings
    warnings.filterwarnings("ignore", category=DeprecationWarning)

    sync_url = settings.DATABASE_URL.replace("+asyncpg", "")  # strip async driver
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker as sync_sessionmaker

    engine_sync = create_engine(sync_url, echo=False, pool_pre_ping=True)
    # Import Base from this module so models are registered
    Base.metadata.create_all(engine_sync)
    engine_sync.dispose()


async def create_all() -> None:
    """Async wrapper: create all tables from ORM models.

    Prefer Alembic migrations in production. This is useful for:
    - Local dev without running `alembic upgrade head`
    - Test fixture setup
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_all() -> None:
    """Drop all tables (CASCADE). Use with caution — destroys data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@asynccontextmanager
async def get_db_session() -> AsyncIterator[AsyncSession]:
    """Standalone session context manager — use outside FastAPI DI if needed."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def seed_database() -> dict:
    """
    Run the full seed data pipeline.
    Creates tables if missing, then inserts demo data.
    """
    from app.db.seed_data import seed_database as _seed_impl

    # Ensure tables exist ( idempotent — only creates missing tables )
    await create_all()

    async with AsyncSessionLocal() as session:
        result = await _seed_impl(session)
        return result

