"""
LETESE● Auth Endpoints
POST /api/v1/auth/send-otp       — Send OTP to email
POST /api/v1/auth/login          — Login with email + OTP
POST /api/v1/auth/signup         — Create tenant + admin user in one call
POST /api/v1/auth/google         — Google OAuth login
POST /api/v1/auth/refresh        — Refresh access token
POST /api/v1/auth/logout         — Revoke refresh token
GET  /api/v1/auth/me             — Current user profile
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timezone
from decimal import Decimal
import time
import redis.asyncio as redis

from app.db.database import get_db
from app.models.models import User, Tenant
from app.services.auth_service import auth_service
from app.core.config import settings


router = APIRouter()


# ── In-memory rate limiter (per-IP, per-endpoint) ───────────────────
# For production, swap to Redis-backed: check `settings.REDIS_URL`
_RATE_LIMIT: dict[str, list[float]] = {}
_RATE_LIMIT_WINDOW_S = 60      # seconds
_RATE_LIMIT_MAX_REQUESTS = 10  # requests per window


async def _check_rate_limit(identifier: str, max_requests: int = 10) -> None:
    """Simple in-memory sliding-window rate limiter per IP + action."""
    now = time.monotonic()
    key = identifier.lower()
    window = _RATE_LIMIT_WINDOW_S

    if key not in _RATE_LIMIT:
        _RATE_LIMIT[key] = []

    # Prune old timestamps
    _RATE_LIMIT[key] = [
        ts for ts in _RATE_LIMIT[key] if now - ts < window
    ]

    if len(_RATE_LIMIT[key]) >= max_requests:
        raise HTTPException(
            429,
            {
                "error": "rate_limit_exceeded",
                "retry_after_s": window,
                "message": f"Too many requests. Please wait {window} seconds.",
            }
        )

    _RATE_LIMIT[key].append(now)


# ── Request/Response Schemas ─────────────────────────────────────────

class SendOtpRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    otp: str


class SignupRequest(BaseModel):
    # Tenant details
    tenant_name: str = Field(..., min_length=2, max_length=255)
    tenant_email: EmailStr
    tenant_phone: str = Field(..., min_length=10, max_length=20)
    plan: str = Field(default="basic", pattern="^(basic|professional|elite|enterprise)$")
    bar_enrolment_no: Optional[str] = Field(default=None, max_length=100)
    gstin: Optional[str] = Field(default=None, max_length=20)
    firm_address: Optional[str] = None
    # Admin user details
    admin_email: EmailStr
    admin_full_name: str = Field(..., min_length=2, max_length=255)
    admin_phone: Optional[str] = Field(default=None, max_length=20)

    class Config:
        json_schema_extra = {
            "example": {
                "tenant_name": "Sharma & Associates",
                "tenant_email": "contact@sharma-law.in",
                "tenant_phone": "+919876543210",
                "plan": "professional",
                "bar_enrolment_no": "BAR/2012/45678",
                "gstin": "09AALFS1234M1ZB",
                "admin_email": "rajesh@sharma-law.in",
                "admin_full_name": "Rajesh Sharma",
                "admin_phone": "+919876543210",
            }
        }


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str
    tenant_id: str


class TenantResponse(BaseModel):
    tenant_id: str
    name: str
    plan: str
    status: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse
    tenant: TenantResponse


# ── Endpoints ────────────────────────────────────────────────────────

@router.post("/signup")
async def signup(
    body: SignupRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new tenant and its first admin user in a single call.
    Sends OTP to the admin email for verification.
    """
    # Rate limit: 3 signups per IP per hour
    ip = request.client.host if request.client else "unknown"
    await _check_rate_limit(f"signup:{ip}", max_requests=3)

    # Validate admin_email matches tenant_email or is distinct
    if body.admin_email == body.tenant_email:
        raise HTTPException(400, "Admin email must be different from tenant email")

    # Check uniqueness
    existing_tenant = await db.execute(
        select(Tenant).where(Tenant.email == body.tenant_email)
    )
    if existing_tenant.scalar_one_or_none():
        raise HTTPException(409, "Tenant with this email already exists")

    existing_user = await db.execute(
        select(User).where(User.email == body.admin_email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(409, "User with this email already exists")

    # Validate bar enrolment for non-basic plans
    if body.plan not in ("basic", "professional") and not body.bar_enrolment_no:
        raise HTTPException(
            400,
            "Bar Enrolment Number is required for Elite and Enterprise plans"
        )

    # Create tenant
    tenant = Tenant(
        name=body.tenant_name,
        email=body.tenant_email,
        phone=body.tenant_phone,
        plan=body.plan,
        bar_enrolment_no=body.bar_enrolment_no,
        gstin=body.gstin,
        firm_address=body.firm_address,
        status="trial",
    )
    db.add(tenant)
    await db.flush()

    # Create admin user for this tenant
    admin_user = User(
        tenant_id=tenant.tenant_id,
        email=body.admin_email,
        full_name=body.admin_full_name,
        phone=body.admin_phone or body.tenant_phone,
        role="admin",
        is_active=True,
    )
    db.add(admin_user)
    await db.commit()

    # Generate OTP for email verification
    redis_client = redis.from_url(settings.REDIS_URL)
    otp = await auth_service.generate_otp(body.admin_email, redis_client)

    # Send OTP email (best-effort)
    try:
        import smtplib
        from email.mime.text import MIMEText

        msg = MIMEText(
            f"Welcome to LETESE● Legal SaaS!\n\n"
            f"Your admin account for {body.tenant_name} has been created.\n"
            f"Your OTP is: {otp}\nValid for 10 minutes.\n\n"
            f"— LETESE● Legal Technologies"
        )
        msg["Subject"] = "Welcome to LETESE● — Your OTP Code"
        msg["From"] = "noreply@letese.xyz"
        msg["To"] = body.admin_email
        with smtplib.SMTP("localhost", 587) as server:
            server.sendmail("noreply@letese.xyz", [body.admin_email], msg.as_string())
    except Exception:
        pass  # Don't fail if SMTP is not configured

    return {
        "message": "Tenant and admin user created. OTP sent to admin email.",
        "tenant_id": str(tenant.tenant_id),
        "user_id": str(admin_user.user_id),
        "email": body.admin_email,
        "expires_in": 600,
    }


@router.post("/send-otp")
async def send_otp(
    body: SendOtpRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Send 6-digit OTP to email address."""
    import smtplib
    from email.mime.text import MIMEText

    # Rate limit: 5 OTP requests per IP per minute
    ip = request.client.host if request.client else "unknown"
    await _check_rate_limit(f"send-otp:{ip}", max_requests=5)

    # Check if user exists
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(404, "User not found. Please sign up first.")

    if not user.is_active:
        raise HTTPException(403, "Account is suspended.")

    # Generate OTP
    redis_client = redis.from_url(settings.REDIS_URL)
    otp = await auth_service.generate_otp(body.email, redis_client)

    # Send email (SMTP configured in environment)
    try:
        msg = MIMEText(
            f"Your LETESE● OTP is: {otp}\nValid for 10 minutes.\n\n— LETESE● Legal SaaS"
        )
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
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Login with email + OTP. Returns JWT access + refresh tokens."""
    # Rate limit: 5 login attempts per IP per minute
    ip = request.client.host if request.client else "unknown"
    await _check_rate_limit(f"login:{ip}", max_requests=5)

    redis_client = redis.from_url(settings.REDIS_URL)

    if not await auth_service.verify_otp(body.email, body.otp, redis_client):
        raise HTTPException(401, "Invalid or expired OTP")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(401, "Account not found or inactive")

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)

    tenant_result = await db.execute(
        select(Tenant).where(Tenant.tenant_id == user.tenant_id)
    )
    tenant = tenant_result.scalar_one()

    access_token = auth_service.create_access_token(user, tenant)
    refresh_token = auth_service.create_refresh_token(str(user.user_id), redis_client)

    await db.commit()

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        user=UserResponse(
            user_id=str(user.user_id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            tenant_id=str(user.tenant_id),
        ),
        tenant=TenantResponse(
            tenant_id=str(tenant.tenant_id),
            name=tenant.name,
            plan=tenant.plan,
            status=tenant.status,
        ),
    )


@router.post("/logout")
async def logout(
    body: RefreshRequest,
    request: Request,
):
    """
    Logout — revoke the refresh token by deleting it from Redis.
    The client should also discard the access token client-side.
    """
    ip = request.client.host if request.client else "unknown"
    await _check_rate_limit(f"logout:{ip}", max_requests=10)

    redis_client = redis.from_url(settings.REDIS_URL)
    key = f"refresh:{body.refresh_token}"
    count = await redis_client.delete(key)

    if count == 0:
        raise HTTPException(401, "Invalid or already-revoked refresh token")

    return {"message": "Logged out successfully"}


@router.post("/google")
async def google_auth(
    id_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Login/register via Google OAuth ID token."""
    import httpx

    # Rate limit
    await _check_rate_limit("google-auth", max_requests=10)

    # Verify Google token
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        )
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
            raise HTTPException(
                400,
                "Please sign up first before linking a Google account"
            )

    if not user.is_active:
        raise HTTPException(401, "Account suspended")

    user.last_login_at = datetime.now(timezone.utc)

    tenant_result = await db.execute(
        select(Tenant).where(Tenant.tenant_id == user.tenant_id)
    )
    tenant = tenant_result.scalar_one()

    access_token = auth_service.create_access_token(user, tenant)
    refresh_token = auth_service.create_refresh_token(str(user.user_id), redis.from_url(settings.REDIS_URL))

    await db.commit()

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
    """Exchange a valid refresh token for a new access token."""
    redis_client = redis.from_url(settings.REDIS_URL)
    user_id_bytes = await redis_client.get(f"refresh:{body.refresh_token}")

    if not user_id_bytes:
        raise HTTPException(401, "Invalid or expired refresh token")

    user_id = user_id_bytes.decode() if isinstance(user_id_bytes, bytes) else user_id_bytes

    # Load user and tenant from DB
    async for db_session in get_db():
        result = await db_session.execute(select(User).where(User.user_id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(401, "User not found or inactive")

        tenant_result = await db_session.execute(
            select(Tenant).where(Tenant.tenant_id == user.tenant_id)
        )
        tenant = tenant_result.scalar_one()

        access_token = auth_service.create_access_token(user, tenant)
        return {
            "access_token": access_token,
            "token_type": "Bearer",
        }


@router.get("/me")
async def get_me(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Return the current authenticated user's profile."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")
    token = authorization[7:]

    try:
        payload = auth_service.verify_token(token)
    except ValueError as e:
        raise HTTPException(401, str(e))

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    tenant_result = await db.execute(
        select(Tenant).where(Tenant.tenant_id == user.tenant_id)
    )
    tenant = tenant_result.scalar_one()

    return {
        "user": {
            "user_id": str(user.user_id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "is_active": user.is_active,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "created_at": user.created_at.isoformat(),
        },
        "tenant": {
            "tenant_id": str(tenant.tenant_id),
            "name": tenant.name,
            "plan": tenant.plan,
            "status": tenant.status,
            "storage_gb": round(tenant.storage_used_bytes / (1024 ** 3), 2),
        },
    }
