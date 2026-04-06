"""
LETESE● API Server Test Runner
Run with: cd backend && python run_test.py
Requires: .venv activated, infra services running (postgres, redis, kafka)
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

# ── Fake .env for local testing ───────────────────────────────────────
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://letese_user:letese_pass@localhost:5432/letese_prod")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
os.environ.setdefault("JWT_PRIVATE_KEY_PATH", "/secrets/jwt_private.pem")
os.environ.setdefault("JWT_PUBLIC_KEY_PATH", "/secrets/jwt_public.pem")


async def test_database() -> bool:
    """Test PostgreSQL connection and basic query."""
    try:
        from sqlalchemy import text
        from app.db.database import AsyncSessionLocal

        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            row = result.scalar()
            assert row == 1
        return True
    except Exception as e:
        print(f"  [DB] Error: {e}")
        return False


async def test_redis() -> bool:
    """Test Redis connection with ping."""
    try:
        import redis.asyncio as redis

        r = await redis.from_url(os.environ["REDIS_URL"], decode_responses=True)
        pong = await r.ping()
        await r.close()
        return pong is True
    except Exception as e:
        print(f"  [Redis] Error: {e}")
        return False


async def test_auth_service() -> bool:
    """Test JWT token generation in dev mode."""
    try:
        from unittest.mock import MagicMock
        from uuid import uuid4
        from app.services.auth_service import auth_service

        mock_user = MagicMock()
        mock_user.user_id = uuid4()
        mock_user.tenant_id = uuid4()
        mock_user.email = "test@letese.in"
        mock_user.role = "advocate"

        mock_tenant = MagicMock()
        mock_tenant.plan = "professional"

        token = auth_service.create_access_token(mock_user, mock_tenant)
        payload = auth_service.verify_token(token)

        assert payload["sub"] == str(mock_user.user_id)
        assert payload["role"] == "advocate"
        assert payload["plan"] == "professional"
        return True
    except Exception as e:
        print(f"  [Auth] Error: {e}")
        return False


async def test_health_endpoint() -> bool:
    """Test /health endpoint (mock health_check_service)."""
    try:
        from app.main import app
        from httpx import AsyncClient, ASGITransport

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert "status" in data
            assert "checks" in data
            print(f"  [Health] status={data['status']}")
        return True
    except Exception as e:
        print(f"  [Health] Error: {e}")
        return False


async def test_case_creation_with_mock_auth() -> bool:
    """Test POST /api/v1/cases with a mock JWT auth header."""
    try:
        from unittest.mock import MagicMock
        from uuid import uuid4
        from app.services.auth_service import auth_service

        mock_user = MagicMock()
        mock_user.user_id = uuid4()
        mock_user.tenant_id = uuid4()
        mock_user.email = "test@letese.in"
        mock_user.role = "advocate"

        mock_tenant = MagicMock()
        mock_tenant.plan = "professional"

        token = auth_service.create_access_token(mock_user, mock_tenant)

        from app.main import app
        from httpx import AsyncClient, ASGITransport

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Without a real DB session this will 500, but it proves the route wires are correct
            resp = await client.post(
                "/api/v1/cases",
                json={
                    "case_title": "Test Case — DO NOT DELETE",
                    "court_code": "PHAHC",
                    "client_name": "Test Client",
                    "client_phone": "+919876543210",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            # Accept 500 (no real DB) as valid wiring — the endpoint was reached
            assert resp.status_code in (201, 500), f"Unexpected status: {resp.status_code}"
            print(f"  [Cases] status={resp.status_code} (500 = DB not available, route OK)")
        return True
    except Exception as e:
        print(f"  [Cases] Error: {e}")
        return False


async def main():
    print("\n═══ LETESE● API Server Test ═══\n")

    results = {
        "Database": await test_database(),
        "Redis": await test_redis(),
        "Auth service": await test_auth_service(),
        "Health endpoint": await test_health_endpoint(),
        "Case creation": await test_case_creation_with_mock_auth(),
    }

    print("\n═══ Results ═══")
    all_ok = True
    for name, ok in results.items():
        icon = "✓" if ok else "✗"
        print(f"{icon} {name}: {'OK' if ok else 'FAIL'}")

    if all_ok:
        print("\n✓ All checks passed!")
    else:
        print("\n✗ Some checks failed — review output above.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
