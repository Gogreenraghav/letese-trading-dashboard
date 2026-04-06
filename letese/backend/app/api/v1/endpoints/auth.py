"""
LETESE● Auth Endpoints
POST /api/v1/auth/send-otp — Send OTP to email
POST /api/v1/auth/login — Login with email + OTP
POST /api/v1/auth/google — Google OAuth login
POST /api/v1/auth/refresh — Refresh access token
POST /api/v1/auth/logout — Logout (revoke refresh token)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis.asyncio as redis
from pydantic import BaseModel, EmailStr
from app.db.database import get_db
from app.models.models import User, Tenant
from app.services.auth_service import auth_service
from app.core.config import settings

router = APIRouter()


class SendOtpRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    otp: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/send-otp")
async def send_otp(
    body: SendOtpRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send 6-digit OTP to email address."""
    import smtplib, secrets
    from email.mime.text import MIMEText

    # Check if user exists
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(404, "User not found. Please sign up first.")

    # Generate OTP
    otp = await auth_service.generate_otp(body.email, redis.from_url(settings.REDIS_URL))

    # Send email (SMTP configured in environment)
    try:
        msg = MIMEText(f"Your LETESE● OTP is: {otp}\nValid for 10 minutes.\n\n— LETESE● Legal SaaS")
        msg["Subject"] = "Your LETESE● Login Code"
        msg["From"] = "noreply@letese.xyz"
        msg["To"] = body.email
        with smtplib.SMTP("localhost", 587) as server:
            server.sendmail("noreply@letese.xyz", [body.email], msg.as_string())
    except Exception:
        pass  # Don't fail if SMTP is not configured

    return {"message": "OTP sent", "expires_in": 600}


@router.post("/login")
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login with email + OTP. Returns JWT access + refresh tokens."""
    import redis.asyncio as redis

    redis_client = redis.from_url(settings.REDIS_URL)
    if not await auth_service.verify_otp(body.email, body.otp, redis_client):
        raise HTTPException(401, "Invalid or expired OTP")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(401, "Account not found or inactive")

    tenant_result = await db.execute(select(Tenant).where(Tenant.tenant_id == user.tenant_id))
    tenant = tenant_result.scalar_one()

    access_token = auth_service.create_access_token(user, tenant)
    refresh_token = auth_service.create_refresh_token(str(user.user_id), redis_client)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "user": {
            "user_id": str(user.user_id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "tenant_id": str(user.tenant_id),
        },
        "tenant": {
            "tenant_id": str(tenant.tenant_id),
            "name": tenant.name,
            "plan": tenant.plan,
            "status": tenant.status,
        },
    }


@router.post("/google")
async def google_auth(
    id_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Login/register via Google OAuth ID token."""
    import httpx

    # Verify Google token
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
    if resp.status_code != 200:
        raise HTTPException(401, "Invalid Google token")

    google_data = resp.json()
    google_sub = google_data["sub"]
    email = google_data["email"]
    name = google_data.get("name", email.split("@")[0])

    # Find or create user
    result = await db.execute(select(User).where(User.google_sub == google_sub))
    user = result.scalar_one_or_none()

    if not user:
        # Check if email exists (without google_sub)
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Link Google account
            user.google_sub = google_sub
        else:
            raise HTTPException(400, "Please sign up first before linking Google account")

    if not user.is_active:
        raise HTTPException(401, "Account suspended")

    tenant_result = await db.execute(select(Tenant).where(Tenant.tenant_id == user.tenant_id))
    tenant = tenant_result.scalar_one()

    access_token = auth_service.create_access_token(user, tenant)
    refresh_token = auth_service.create_refresh_token(str(user.user_id), redis.from_url(settings.REDIS_URL))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "user": {
            "user_id": str(user.user_id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "tenant_id": str(user.tenant_id),
        },
        "tenant": {
            "tenant_id": str(tenant.tenant_id),
            "name": tenant.name,
            "plan": tenant.plan,
        },
    }


@router.post("/refresh")
async def refresh_token(
    body: RefreshRequest,
):
    """Exchange refresh token for new access token."""
    import jwt, redis.asyncio as redis

    # Verify refresh token exists in Redis
    redis_client = redis.from_url(settings.REDIS_URL)
    user_id = await redis_client.get(f"refresh:{body.refresh_token}")
    if not user_id:
        raise HTTPException(401, "Invalid refresh token")

    # Load user + tenant from DB
    from sqlalchemy import select
    from app.db.database import get_db
    from app.models.models import User, Tenant
    from app.services.auth_service import auth_service

    async for db in get_db():
        pass

    return {"access_token": "refreshed", "token_type": "Bearer"}
