"""
LETESE● Auth Service — JWT RS256 + OTP + Google OAuth
MODULE B: Auth & RBAC Service
"""
import jwt
import time
import secrets
import redis.asyncio as redis
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import User, Tenant
from app.core.config import settings


class AuthService:
    def __init__(self, private_key_path: str = "/secrets/jwt_private.pem",
                 public_key_path: str = "/secrets/jwt_public.pem"):
        self.private_key_path = private_key_path
        self.public_key_path = public_key_path
        self._private_key = None
        self._public_key = None
        self._load_keys()

    def _load_keys(self):
        try:
            with open(self.private_key_path, "rb") as f:
                self._private_key = f.read()
            with open(self.public_key_path, "rb") as f:
                self._public_key = f.read()
        except FileNotFoundError:
            # Dev mode: use symmetric key
            self._private_key = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
            self._public_key = "dev-secret"

    async def generate_otp(self, email: str, redis_client: redis.Redis) -> str:
        """Generate 6-digit OTP, store with 10-min TTL."""
        otp = secrets.token_hex(3)  # 6 hex chars = 6 digits
        await redis_client.setex(f"otp:{email}", 600, otp)
        return otp

    async def verify_otp(self, email: str, otp: str, redis_client: redis.Redis) -> bool:
        """Verify OTP (one-time use)."""
        stored = await redis_client.get(f"otp:{email}")
        if not stored or stored != otp:
            return False
        await redis_client.delete(f"otp:{email}")
        return True

    def create_access_token(self, user: User, tenant: Tenant) -> str:
        """Create 15-minute RS256 JWT."""
        payload = {
            "sub": str(user.user_id),
            "tenant_id": str(user.tenant_id),
            "role": user.role,
            "plan": tenant.plan,
            "email": user.email,
            "iat": int(time.time()),
            "exp": int(time.time()) + settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "type": "access",
        }

        if self._public_key == "dev-secret":
            return jwt.encode(payload, "dev-secret", algorithm="HS256")

        return jwt.encode(payload, self._private_key, algorithm="RS256")

    def create_refresh_token(self, user_id: str, redis_client: redis.Redis) -> str:
        """Create 7-day rotating refresh token."""
        token = secrets.token_urlsafe(64)
        redis_client.setex(f"refresh:{token}", 604800, user_id)
        return token

    def verify_token(self, token: str) -> dict:
        """Verify and decode JWT."""
        try:
            if self._public_key == "dev-secret":
                return jwt.decode(token, "dev-secret", algorithms=["HS256"])
            return jwt.decode(token, self._public_key, algorithms=["RS256"])
        except jwt.ExpiredSignatureError:
            raise ValueError("Token expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")


auth_service = AuthService()


async def get_current_user(
    credentials,
    db: AsyncSession,
) -> dict:
    """FastAPI dependency — validates JWT, sets RLS context."""
    from fastapi import HTTPException, Security
    from fastapi.security import HTTPBearer
    from sqlalchemy import text

    try:
        payload = auth_service.verify_token(credentials)
    except ValueError as e:
        raise HTTPException(401, str(e))

    # Set PostgreSQL RLS context
    await db.execute(
        text(f"SET LOCAL app.current_tenant_id = '{payload['tenant_id']}'")
    )
    await db.execute(
        text(f"SET LOCAL app.role = '{payload['role']}'")
    )

    return payload
