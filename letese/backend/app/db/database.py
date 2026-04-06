"""
LETESE● Database Connection & Session Management
Uses SQLAlchemy 2.0 async with connection pooling.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
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
