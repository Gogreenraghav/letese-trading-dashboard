"""
LETESE● Team Management API
MODULE E-CA: Customer Admin — Team RBAC
POST   /api/v1/admin/users/invite  — Invite user via magic link
PATCH  /api/v1/admin/users/{id}   — Update role or status
DELETE /api/v1/admin/users/{id}    — Soft delete + reassign cases
GET    /api/v1/admin/users        — List all tenant users
"""
import secrets
from uuid import UUID
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.api.deps import require_admin, get_current_user


router = APIRouter(prefix="/api/v1/admin", tags=["Team"])


# ── Pydantic Schemas ─────────────────────────────────────────────────

class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str = Field(..., pattern="^(admin|advocate|clerk|paralegal|intern)$")
    full_name: Optional[str] = None


class UpdateUserRequest(BaseModel):
    role: Optional[str] = Field(None, pattern="^(admin|advocate|clerk|paralegal|intern)$")
    is_active: Optional[bool] = None
    full_name: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────

@router.post("/users/invite")
async def invite_user(
    body: InviteUserRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_admin),
):
    """
    Create a pending invite and send magic link email.
    Returns: {message, expires_in: 86400}
    """
    from app.models.models import User, Tenant
    from app.services.kafka_producer import publish_communication_dispatch

    tenant_id = UUID(user["tenant_id"])

    # Check if email already exists in this tenant
    existing = await db.execute(
        select(User).where(
            User.email == body.email,
            User.tenant_id == tenant_id,
            User.deleted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "User with this email already exists in your firm")

    # Generate magic link token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    # Store invite in Redis (TTL 24h)
    import redis.asyncio as redis
    from app.core.config import settings
    redis_client = redis.from_url(settings.REDIS_URL)
    invite_key = f"invite:{token}"
    invite_data = {
        "email": body.email,
        "role": body.role,
        "tenant_id": str(tenant_id),
        "invited_by": user["sub"],
        "expires_at": expires_at.isoformat(),
    }
    if body.full_name:
        invite_data["full_name"] = body.full_name
    await redis_client.setex(invite_key, 86400, __import__("json").dumps(invite_data))
    await redis_client.aclose()

    invite_url = f"https://app.letese.xyz/auth/accept-invite?token={token}"

    # Get tenant name
    tenant = await db.get(Tenant, tenant_id)

    # Dispatch magic link via email
    await publish_communication_dispatch({
        "tenant_id": str(tenant_id),
        "message_type": "system_email",
        "channel": "email",
        "recipient_email": body.email,
        "template_name": "team_invite",
        "template_params": {
            "invite_url": invite_url,
            "firm_name": tenant.name if tenant else "LETESE",
            "role": body.role.upper(),
            "expires_in": "24 hours",
            "invited_by": user.get("email", "Admin"),
        },
        "priority": "normal",
    })

    return {
        "message": f"Invitation sent to {body.email}",
        "expires_in": 86400,
        "invite_url": invite_url if settings.DEBUG else None,  # Only in dev
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: UUID,
    body: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_admin),
):
    """
    Update user role or is_active status.
    If role changes, reassign open cases to another advocate/admin.
    """
    from app.models.models import User, Case

    tenant_id = UUID(user["tenant_id"])

    # Get target user
    result = await db.execute(
        select(User).where(
            User.user_id == user_id,
            User.tenant_id == tenant_id,
            User.deleted_at.is_(None),
        )
    )
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(404, "User not found")

    # Prevent self-demotion from admin
    if str(target_user.user_id) == user["sub"] and body.role and body.role != "admin":
        raise HTTPException(400, "Cannot change your own admin role")

    old_role = target_user.role

    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(target_user, key, value)

    # If role changed away from advocate, reassign open cases
    if "role" in updates and updates["role"] != old_role and old_role in ("advocate", "admin"):
        # Find another active advocate or admin to reassign to
        reassign_result = await db.execute(
            select(User).where(
                User.tenant_id == tenant_id,
                User.role.in_("advocate", "admin"),
                User.is_active == True,
                User.user_id != user_id,
                User.deleted_at.is_(None),
            ).limit(1)
        )
        new_assignee = reassign_result.scalar_one_or_none()

        if new_assignee:
            await db.execute(
                update(Case)
                .where(
                    Case.tenant_id == tenant_id,
                    Case.assigned_user_id == user_id,
                    Case.status == "active",
                    Case.deleted_at.is_(None),
                )
                .values(assigned_user_id=new_assignee.user_id)
            )

    await db.commit()
    await db.refresh(target_user)

    return {
        "message": "User updated",
        "user_id": str(user_id),
        "changes": updates,
    }


@router.delete("/users/{user_id}")
async def remove_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_admin),
):
    """
    Soft delete user (set deleted_at).
    Reassigns all open cases to the admin making the request.
    """
    from app.models.models import User, Case
    from datetime import datetime as dt

    tenant_id = UUID(user["tenant_id"])
    admin_user_id = UUID(user["sub"])

    if user_id == admin_user_id:
        raise HTTPException(400, "Cannot remove yourself")

    # Get target user
    result = await db.execute(
        select(User).where(
            User.user_id == user_id,
            User.tenant_id == tenant_id,
            User.deleted_at.is_(None),
        )
    )
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(404, "User not found")

    # Reassign open cases to admin
    await db.execute(
        update(Case)
        .where(
            Case.tenant_id == tenant_id,
            Case.assigned_user_id == user_id,
            Case.status == "active",
            Case.deleted_at.is_(None),
        )
        .values(assigned_user_id=admin_user_id)
    )

    # Soft delete
    target_user.deleted_at = dt.now(timezone.utc)
    target_user.is_active = False
    await db.commit()

    return {
        "message": f"User {target_user.full_name} removed",
        "reassigned_cases_to": str(admin_user_id),
    }


@router.get("/users")
async def list_users(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_admin),
):
    """
    List all users in the tenant with stats.
    Returns: avatar initials, role, status, last login, open case count.
    """
    from app.models.models import User, Case

    tenant_id = UUID(user["tenant_id"])

    # Count open cases per user
    cases_result = await db.execute(
        select(
            Case.assigned_user_id,
            func.count(Case.case_id),
        )
        .where(
            Case.tenant_id == tenant_id,
            Case.status == "active",
            Case.deleted_at.is_(None),
        )
        .group_by(Case.assigned_user_id)
    )
    open_case_counts = {str(r[0]): r[1] for r in cases_result.fetchall()}

    # Total active users count
    count_result = await db.execute(
        select(func.count(User.user_id)).where(
            User.tenant_id == tenant_id,
            User.deleted_at.is_(None),
        )
    )
    total_users = count_result.scalar()

    # Paginated users
    result = await db.execute(
        select(User)
        .where(
            User.tenant_id == tenant_id,
            User.deleted_at.is_(None),
        )
        .order_by(User.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    users = result.scalars().all()

    return {
        "users": [
            {
                "user_id": str(u.user_id),
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
                "created_at": u.created_at.isoformat(),
                "open_cases": open_case_counts.get(str(u.user_id), 0),
                "avatar_initials": "".join(
                    part[0].upper() for part in u.full_name.split()[:2]
                ),
            }
            for u in users
        ],
        "total": total_users,
        "limit": limit,
        "offset": offset,
    }
