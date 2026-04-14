"""
Admin Router — Super Admin endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Optional, List

from ..database import get_db
from ..models import User, Portfolio, Trade, Signal, AdminLog, Watchlist
from ..auth.utils import get_admin_user
from .schemas import (
    AdminUserResponse, AdminDashboardStats, AdminPlanUpdate, AdminUserCreate
)
from ..auth.utils import hash_password

router = APIRouter(prefix="/admin", tags=["Admin"])


def _user_dict(user) -> dict:
    def _str(v):
        return str(v) if v is not None else None
    return {
        "id": _str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "plan": user.plan,
        "subscription_status": user.subscription_status,
        "telegram_chat_id": user.telegram_chat_id,
        "is_active": user.is_active,
        "is_admin": user.is_admin,
        "email_verified": user.email_verified,
        "max_stocks": user.max_stocks,
        "live_trading": user.live_trading,
        "created_at": user.created_at,
    }


# ─── STATS ─────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminDashboardStats)
def admin_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()

    plan_counts = dict(
        db.query(User.plan, func.count(User.id))
        .group_by(User.plan).all()
    )

    total_signals = db.query(Signal).count()
    total_trades_month = db.query(Trade).filter(Trade.created_at >= month_start).count()

    # Revenue: sum subscription values (rough estimate based on plan prices)
    plan_prices = {"free": 0, "basic": 499, "pro": 1999, "enterprise": 4999}
    total_revenue = sum(
        count * plan_prices.get(plan, 0)
        for plan, count in plan_counts.items()
    )

    return AdminDashboardStats(
        total_users=total_users,
        active_users=active_users,
        free_users=plan_counts.get("free", 0),
        basic_users=plan_counts.get("basic", 0),
        pro_users=plan_counts.get("pro", 0),
        enterprise_users=plan_counts.get("enterprise", 0),
        total_revenue_month=total_revenue,
        total_trades_month=total_trades_month,
        total_signals_generated=total_signals,
    )


# ─── USER MANAGEMENT ────────────────────────────────────────────

@router.get("/users", response_model=List[AdminUserResponse])
def list_users(
    plan: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if plan:
        q = q.filter(User.plan == plan)
    if status == "active":
        q = q.filter(User.is_active == True)
    elif status == "inactive":
        q = q.filter(User.is_active == False)
    if search:
        q = q.filter(
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )
    offset = (page - 1) * limit
    return q.order_by(desc(User.created_at)).offset(offset).limit(limit).all()


@router.get("/users/{user_id}", response_model=AdminUserResponse)
def get_user(
    user_id: str,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminUserResponse(**_user_dict(user))


@router.get("/users/{user_id}/details")
def get_user_full_details(
    user_id: str,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    portfolios = db.query(Portfolio).filter(Portfolio.user_id == user_id).all()
    trades = db.query(Trade).filter(Trade.user_id == user_id).order_by(desc(Trade.created_at)).limit(50).all()
    signals = db.query(Signal).filter(Signal.user_id == user_id).order_by(desc(Signal.created_at)).limit(50).all()
    watchlist = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
    logs = db.query(AdminLog).filter(AdminLog.target_user_id == user_id).order_by(desc(AdminLog.created_at)).limit(20).all()

    return {
        "user": AdminUserResponse(**_user_dict(user)),
        "portfolios": portfolios,
        "trades": trades,
        "signals": signals,
        "watchlist": watchlist,
        "admin_logs": logs,
    }


@router.post("/users")
def create_user(
    schema: AdminUserCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == schema.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    plan_limits = {"free": (5, 1, False), "basic": (20, 1, False), "pro": (50, 5, True), "enterprise": (200, 10, True)}
    max_s, max_st, live = plan_limits.get(schema.plan, (5, 1, False))

    user = User(
        email=schema.email.lower(),
        password_hash=hash_password(schema.password),
        full_name=schema.full_name,
        phone=schema.phone,
        plan=schema.plan,
        is_admin=schema.is_admin,
        max_stocks=max_s,
        max_strategies=max_st,
        live_trading=live,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log admin action
    log = AdminLog(admin_id=admin.id, action="user_created", target_user_id=user.id)
    db.add(log)
    db.commit()

    return AdminUserResponse(**_user_dict(user))


@router.put("/users/{user_id}")
def update_user(
    user_id: str,
    plan: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    subscription_status: Optional[str] = None,
    max_stocks: Optional[int] = None,
    live_trading: Optional[bool] = None,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if plan is not None:
        plan_limits = {"free": (5, 1, False), "basic": (20, 1, False), "pro": (50, 5, True), "enterprise": (200, 10, True)}
        max_s, max_st, live = plan_limits.get(plan, (5, 1, False))
        user.plan = plan
        user.max_stocks = max_s
        user.max_strategies = max_st
        user.live_trading = live

    if is_active is not None: user.is_active = is_active
    if is_admin is not None: user.is_admin = is_admin
    if subscription_status is not None: user.subscription_status = subscription_status
    if max_stocks is not None: user.max_stocks = max_stocks
    if live_trading is not None: user.live_trading = live_trading

    db.commit()
    db.refresh(user)

    log = AdminLog(admin_id=admin.id, action="user_updated", target_user_id=user.id)
    db.add(log)
    db.commit()

    return AdminUserResponse(**_user_dict(user))


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if str(user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log = AdminLog(admin_id=admin.id, action="user_deleted", target_user_id=user.id)
    db.add(log)
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


# ─── ADMIN LOGS ─────────────────────────────────────────────────

@router.get("/logs", response_model=List[dict])
def get_admin_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=200),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    logs = db.query(AdminLog).order_by(desc(AdminLog.created_at)).offset(offset).limit(limit).all()
    return [
        {
            "id": str(log.id),
            "admin_id": str(log.admin_id),
            "action": log.action,
            "target_user_id": str(log.target_user_id) if log.target_user_id else None,
            "details": log.details,
            "created_at": log.created_at,
        }
        for log in logs
    ]