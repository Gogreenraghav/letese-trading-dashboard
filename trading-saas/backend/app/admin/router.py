"""
Admin Router — Super Admin Dashboard APIs
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.admin.utils import get_current_admin
from datetime import datetime, timedelta
import json

router = APIRouter()

# ── Response Schemas ─────────────────────────────────────────────────

class UserSummary(BaseModel):
    id: str
    email: str
    phone: str
    full_name: str
    role: str
    plan: str
    subscription_status: str
    subscription_end: str
    is_active: bool
    telegram_connected: bool
    created_at: str
    last_login: str

class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    trial_users: int
    paid_users: int
    total_revenue: int
    monthly_revenue: int
    total_trades: int
    today_trades: int
    total_positions: int
    profitable_trades: int
    avg_pnl_percent: float

class PlanSummary(BaseModel):
    plan_name: str
    users_count: int
    revenue: int

# ── Dashboard Stats ─────────────────────────────────────────────────

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(admin = Depends(get_current_admin)):
    """Get overall platform statistics."""
    with get_db() as conn:
        cur = conn.cursor()
        
        # User counts
        cur.execute("""
            SELECT 
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE subscription_status = 'active') as active_users,
                COUNT(*) FILTER (WHERE subscription_status = 'trial') as trial_users,
                COUNT(*) FILTER (WHERE subscription_status = 'active' AND plan_id != (SELECT id FROM trading_plans WHERE name='free')) as paid_users
            FROM trading_users WHERE is_active = true
        """)
        user_stats = cur.fetchone()
        
        # Revenue
        cur.execute("""
            SELECT 
                COALESCE(SUM(amount) FILTER (WHERE status='completed'), 0) as total_revenue,
                COALESCE(SUM(amount) FILTER (WHERE status='completed' AND created_at > NOW() - INTERVAL '30 days'), 0) as monthly_revenue
            FROM subscription_payments
        """)
        revenue = cur.fetchone()
        
        # Trades
        cur.execute("""
            SELECT 
                COUNT(*) as total_trades,
                COUNT(*) FILTER (WHERE executed_at > CURRENT_DATE) as today_trades,
                COUNT(*) FILTER (WHERE pnl > 0) as profitable_trades,
                AVG(pnl_percent) FILTER (WHERE pnl_percent IS NOT NULL) as avg_pnl
            FROM trading_trades
        """)
        trades = cur.fetchone()
        
        # Open positions
        cur.execute("SELECT COUNT(*) as positions FROM trading_positions WHERE status = 'open'")
        positions = cur.fetchone()
        
        return DashboardStats(
            total_users=user_stats['total_users'] or 0,
            active_users=user_stats['active_users'] or 0,
            trial_users=user_stats['trial_users'] or 0,
            paid_users=user_stats['paid_users'] or 0,
            total_revenue=(revenue['total_revenue'] or 0) // 100,  # convert paise to ₹
            monthly_revenue=(revenue['monthly_revenue'] or 0) // 100,
            total_trades=trades['total_trades'] or 0,
            today_trades=trades['today_trades'] or 0,
            total_positions=positions['positions'] or 0,
            profitable_trades=trades['profitable_trades'] or 0,
            avg_pnl_percent=float(trades['avg_pnl'] or 0)
        )


@router.get("/users", response_model=List[UserSummary])
async def get_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = None,
    plan: str = None,
    status: str = None,
    admin = Depends(get_current_admin)
):
    """Get all users with pagination and filters."""
    with get_db() as conn:
        cur = conn.cursor()
        
        where = ["u.is_active = true"]
        values = []
        
        if search:
            where.append("(u.email ILIKE %s OR u.full_name ILIKE %s OR u.phone ILIKE %s)")
            s = f"%{search}%"
            values.extend([s, s, s])
        
        if plan:
            where.append("p.name = %s")
            values.append(plan)
        
        if status:
            where.append("u.subscription_status = %s")
            values.append(status)
        
        offset = (page - 1) * limit
        values.extend([limit, offset])
        
        query = f"""
            SELECT u.id, u.email, u.phone, u.full_name, COALESCE(u.role,'user') as role,
                   p.name as plan, u.subscription_status, u.subscription_end,
                   u.is_active, u.telegram_chat_id, u.last_login_at, u.created_at
            FROM trading_users u
            JOIN trading_plans p ON p.id = u.plan_id
            WHERE {' AND '.join(where)}
            ORDER BY u.created_at DESC
            LIMIT %s OFFSET %s
        """
        cur.execute(query, values)
        users = cur.fetchall()
        
        return [
            UserSummary(
                id=str(u['id']),
                email=u['email'],
                phone=u['phone'],
                full_name=u['full_name'],
                role=u['role'],
                plan=u['plan'],
                subscription_status=u['subscription_status'],
                subscription_end=str(u['subscription_end'] or ''),
                is_active=u['is_active'],
                telegram_connected=bool(u['telegram_chat_id']),
                created_at=str(u['created_at']),
                last_login=str(u['last_login_at'] or '')
            ) for u in users
        ]


@router.get("/users/{user_id}")
async def get_user_detail(user_id: str, admin = Depends(get_current_admin)):
    """Get detailed info about a specific user."""
    with get_db() as conn:
        cur = conn.cursor()
        
        # User info
        cur.execute("""
            SELECT u.*, p.name as plan_name, p.display_name as plan_display
            FROM trading_users u
            JOIN trading_plans p ON p.id = u.plan_id
            WHERE u.id = %s
        """, (user_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Positions
        cur.execute("""
            SELECT symbol, quantity, entry_price, current_price, strategy, status, entry_time
            FROM trading_positions WHERE user_id = %s ORDER BY entry_time DESC LIMIT 20
        """, (user_id,))
        positions = cur.fetchall()
        
        # Recent trades
        cur.execute("""
            SELECT symbol, action, quantity, price, pnl, pnl_percent, strategy, executed_at
            FROM trading_trades WHERE user_id = %s ORDER BY executed_at DESC LIMIT 20
        """, (user_id,))
        trades = cur.fetchall()
        
        # Payments
        cur.execute("""
            SELECT amount, status, payment_method, created_at
            FROM subscription_payments WHERE user_id = %s ORDER BY created_at DESC LIMIT 10
        """, (user_id,))
        payments = cur.fetchall()
        
        return {
            "user": dict(user),
            "positions": [dict(p) for p in positions],
            "trades": [dict(t) for t in trades],
            "payments": [dict(p) for p in payments]
        }


@router.post("/users/{user_id}/plan")
async def update_user_plan(
    user_id: str,
    plan_name: str,
    admin = Depends(get_current_admin)
):
    """Change a user's subscription plan."""
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM trading_plans WHERE name = %s", (plan_name,))
        plan = cur.fetchone()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        cur.execute("""
            UPDATE trading_users SET plan_id = %s, updated_at = NOW()
            WHERE id = %s
        """, (plan['id'], user_id))
        
        # Log admin action
        admin_id = admin.get("sub")
        cur.execute("""
            INSERT INTO admin_logs (admin_user_id, action, target_user_id, details)
            VALUES (%s, 'change_plan', %s, %s)
        """, (admin_id, user_id, json.dumps({"plan": plan_name})))
        
        conn.commit()
        return {"message": f"Plan updated to {plan_name}"}


@router.post("/users/{user_id}/suspend")
async def suspend_user(user_id: str, admin = Depends(get_current_admin)):
    """Suspend a user account."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("UPDATE trading_users SET is_active = false, updated_at = NOW() WHERE id = %s", (user_id,))
        
        admin_id = admin.get("sub")
        cur.execute("""
            INSERT INTO admin_logs (admin_user_id, action, target_user_id, details)
            VALUES (%s, 'suspend_user', %s, %s)
        """, (admin_id, user_id, '{}'))
        
        conn.commit()
        return {"message": "User suspended"}


@router.post("/users/{user_id}/activate")
async def activate_user(user_id: str, admin = Depends(get_current_admin)):
    """Reactivate a suspended user."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("UPDATE trading_users SET is_active = true, updated_at = NOW() WHERE id = %s", (user_id,))
        conn.commit()
        return {"message": "User activated"}


@router.get("/plans", response_model=List[dict])
async def get_all_plans(admin = Depends(get_current_admin)):
    """Get all subscription plans."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT p.*, COUNT(u.id) as users_count
            FROM trading_plans p
            LEFT JOIN trading_users u ON u.plan_id = p.id AND u.is_active = true
            GROUP BY p.id ORDER BY p.price_monthly
        """)
        plans = cur.fetchall()
        return [dict(p) for p in plans]


@router.get("/logs")
async def get_admin_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin = Depends(get_current_admin)
):
    """Get admin action logs."""
    with get_db() as conn:
        cur = conn.cursor()
        offset = (page - 1) * limit
        cur.execute("""
            SELECT l.*, u.email as admin_email
            FROM admin_logs l
            LEFT JOIN trading_users u ON u.id = l.admin_user_id
            ORDER BY l.created_at DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        logs = cur.fetchall()
        return [dict(l) for l in logs]


@router.get("/analytics/overview")
async def get_analytics(
    days: int = Query(30, ge=1, le=365),
    admin = Depends(get_current_admin)
):
    """Get analytics over a period."""
    with get_db() as conn:
        cur = conn.cursor()
        
        # User growth
        cur.execute("""
            SELECT DATE(created_at) as date, COUNT(*) as new_users
            FROM trading_users
            WHERE created_at > NOW() - INTERVAL '%s days'
            GROUP BY DATE(created_at) ORDER BY date
        """, (days,))
        user_growth = cur.fetchall()
        
        # Daily trades
        cur.execute("""
            SELECT DATE(executed_at) as date, COUNT(*) as trades, SUM(pnl) as total_pnl
            FROM trading_trades
            WHERE executed_at > NOW() - INTERVAL '%s days'
            GROUP BY DATE(executed_at) ORDER BY date
        """, (days,))
        trade_data = cur.fetchall()
        
        # Plan distribution
        cur.execute("""
            SELECT p.name, COUNT(u.id) as users
            FROM trading_plans p
            LEFT JOIN trading_users u ON u.plan_id = p.id AND u.is_active = true
            GROUP BY p.name, p.price_monthly ORDER BY p.price_monthly
        """)
        plan_dist = cur.fetchall()
        
        return {
            "user_growth": [dict(r) for r in user_growth],
            "trade_data": [dict(r) for r in trade_data],
            "plan_distribution": [dict(r) for r in plan_dist]
        }
