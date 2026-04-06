"""
LETESE● FastAPI Dependencies — Auth middleware, RBAC, plan checks.
"""
from typing import Callable
from fastapi import Depends, HTTPException, Header, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.services.auth_service import auth_service
from app.services.rbac import check_permission, check_plan_feature, Action

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Dependency: Validates JWT Bearer token, sets PostgreSQL RLS context.
    Use as: user: dict = Depends(get_current_user)
    """
    if not credentials:
        raise HTTPException(401, "Missing authentication token")

    try:
        payload = auth_service.verify_token(credentials.credentials)
    except ValueError as e:
        raise HTTPException(401, str(e))

    # Set PostgreSQL RLS context for tenant isolation
    await db.execute(
        text(f"SET LOCAL app.current_tenant_id = '{payload['tenant_id']}'")
    )
    await db.execute(
        text(f"SET LOCAL app.role = '{payload['role']}'")
    )

    return payload


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict | None:
    """Dependency: Returns user if authenticated, None otherwise."""
    if not credentials:
        return None
    try:
        return auth_service.verify_token(credentials.credentials)
    except ValueError:
        return None


def require_role(*roles: str):
    """
    Dependency factory: Requires user to have one of the specified roles.
    Usage: user: dict = Depends(require_role("admin", "advocate"))
    """
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(
                403,
                f"Access denied. Required role: {' or '.join(roles)}"
            )
        return user
    return checker


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Require admin or super_admin role."""
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required")
    return user


async def require_super_admin(user: dict = Depends(get_current_user)) -> dict:
    """Require super_admin role."""
    if user.get("role") != "super_admin":
        raise HTTPException(403, "Super admin access required")
    return user


def require_action_permission(*actions: Action):
    """
    Dependency factory: Requires user to have specific action permission.
    Usage: user: dict = Depends(require_action_permission(Action.EDIT_CASE))
    """
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        for action in actions:
            if not check_permission(user.get("role", ""), action):
                raise HTTPException(
                    403,
                    f"Permission denied: '{action.value}' is not allowed for role '{user.get('role')}'"
                )
        return user
    return checker


def require_plan_feature(*features: str):
    """
    Dependency factory: Requires user's plan to include specific features.
    Usage: user: dict = Depends(require_plan_feature("ai_drafting", "translation"))
    """
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        plan = user.get("plan", "basic")
        missing = [f for f in features if not check_plan_feature(plan, f)]
        if missing:
            raise HTTPException(
                402,
                {
                    "upgrade_required": True,
                    "plan": plan,
                    "missing_features": missing,
                    "message": f"Upgrade to Elite or Enterprise to use: {', '.join(missing)}"
                }
            )
        return user
    return checker
