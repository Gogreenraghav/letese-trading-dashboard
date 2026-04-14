"""
Admin Router - Super Admin Dashboard APIs
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.database import get_db
from app.models import User, Plan, Subscription, ActivityLog, Case
from app.auth import get_current_user, verify_admin_token
from app.config import ADMIN_TOKEN

import uuid
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])

def admin_required(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin token required")
    token = authorization[7:]
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    return True

def log_activity(user_id, user_email, action, details, db, ip="system"):
    log = ActivityLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        user_email=user_email,
        action=action,
        details=details,
        ip_address=ip,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()

# ── GET /admin/users ──
@router.get("/users")
def get_users(
    search: str = "",
    plan_filter: str = "",
    status_filter: str = "",
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    admin_required(authorization)
    
    query = db.query(User)
    users = query.all()
    
    result = []
    for u in users:
        sub = db.query(Subscription).filter(
            Subscription.user_id == u.id,
            Subscription.status == "active"
        ).first()
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first() if sub else None
        
        result.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "firm_name": u.firm_name,
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "max_cases": u.max_cases,
            "case_count": db.query(Case).filter(Case.user_id == u.id).count(),
            "plan_name": plan.name if plan else None,
            "plan_id": sub.plan_id if sub else None,
            "subscription_status": sub.status if sub else None,
            "created_at": str(u.created_at) if u.created_at else None,
        })
    
    return {"users": result, "plans": db.query(Plan).all()}

# ── POST /admin/users ──
@router.post("/users")
def create_user(data: dict, db: Session = Depends(get_db), authorization: str = Header(None)):
    admin_required(authorization)
    from app.auth import get_password_hash
    from app.models import User
    
    existing = db.query(User).filter(User.email == data["email"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user = User(
        id=str(uuid.uuid4()),
        email=data["email"],
        hashed_password=get_password_hash(data["password"]),
        name=data.get("name", ""),
        firm_name=data.get("firm_name", ""),
        role=data.get("role", "advocate"),
        max_cases=data.get("max_cases", 10),
    )
    db.add(user)
    db.commit()
    log_activity(user.id, user.email, "user_created", f"Created by admin: {data['email']}", db)
    return {"id": user.id, "message": "User created"}

# ── PUT /admin/users/{user_id}/subscription ──
@router.post("/users/{user_id}/subscription")
def activate_subscription(user_id: str, data: dict, db: Session = Depends(get_db), authorization: str = Header(None)):
    admin_required(authorization)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if not sub:
        plan = db.query(Plan).filter(Plan.id == data.get("plan_id")).first()
        sub = Subscription(
            id=str(uuid.uuid4()),
            user_id=user_id,
            plan_id=data.get("plan_id"),
            plan_name=plan.name if plan else "Manual",
            razorpay_subscription_id=data.get("razorpay_subscription_id", "admin-activate"),
            status="active",
            amount_paid=float(data.get("amount", 0)),
            started_at=datetime.utcnow(),
            ends_at=datetime.utcnow(),
        )
        db.add(sub)
    
    sub.status = "active"
    user.is_active = True
    db.commit()
    log_activity(user_id, user.email, "subscription_activated", f"Plan activated by admin", db)
    return {"message": "Subscription activated"}

# ── DELETE /admin/users/{user_id} ──
@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), authorization: str = Header(None)):
    admin_required(authorization)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

# ── Plans ──
@router.get("/plans")
def get_plans(db: Session = Depends(get_db), authorization: str = Header(None)):
    admin_required(authorization)
    plans = db.query(Plan).all()
    return {"plans": plans}

@router.post("/plans")
def create_plan(data: dict, db: Session = Depends(get_db), authorization: str = Header(None)):
    admin_required(authorization)
    plan = Plan(
        id=str(uuid.uuid4()),
        name=data["name"],
        description=data.get("description", ""),
        monthly_price=int(data.get("monthly_price", 0)),
        yearly_price=int(data.get("yearly_price", 0)),
        max_cases=int(data.get("max_cases", 10)),
        max_advocates=int(data.get("max_advocates", 1)),
        features=data.get("features", []),
    )
    db.add(plan)
    db.commit()
    return {"id": plan.id, "message": "Plan created"}

@router.put("/plans/{plan_id}")
def update_plan(plan_id: str, data: dict, db: Session = Depends(get_db), authorization: str = Header(None)):
    admin_required(authorization)
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    for key in ["name", "monthly_price", "yearly_price", "max_cases", "max_advocates", "features"]:
        if key in data:
            setattr(plan, key, data[key])
    db.commit()
    return {"message": "Plan updated"}

@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: str, db: Session = Depends(get_db), authorization: str = Header(None)):
    admin_required(authorization)
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted"}

# ── Subscriptions ──
@router.get("/subscriptions")
def get_all_subscriptions(db: Session = Depends(get_db), authorization: str = Header(None)):
    admin_required(authorization)
    subs = db.query(Subscription).all()
    result = []
    for s in subs:
        user = db.query(User).filter(User.id == s.user_id).first()
        result.append({
            "id": s.id,
            "user_id": s.user_id,
            "user_email": user.email if user else None,
            "plan_id": s.plan_id,
            "plan_name": s.plan_name,
            "status": s.status,
            "amount_paid": s.amount_paid,
            "razorpay_subscription_id": s.razorpay_subscription_id,
            "started_at": str(s.started_at) if s.started_at else None,
            "ends_at": str(s.ends_at) if s.ends_at else None,
        })
    return {"subscriptions": result}

# ── Activity ──
@router.get("/activity")
def get_activity(limit: int = 100, db: Session = Depends(get_db), authorization: str = Header(None)):
    admin_required(authorization)
    logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(limit).all()
    return {"activity": [
        {
            "id": l.id,
            "user_id": l.user_id,
            "user_email": l.user_email,
            "action": l.action,
            "details": l.details,
            "ip_address": l.ip_address,
            "timestamp": str(l.timestamp) if l.timestamp else None,
        }
        for l in logs
    ]}

# ── Dashboard Stats ──
@router.get("/stats")
def get_stats(db: Session = Depends(get_db), authorization: str = Header(None)):
    admin_required(authorization)
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_subs = db.query(Subscription).count()
    active_subs = db.query(Subscription).filter(Subscription.status == "active").count()
    total_revenue = db.query(func.sum(Subscription.amount_paid)).scalar() or 0
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_subscriptions": total_subs,
        "active_subscriptions": active_subs,
        "total_revenue": float(total_revenue),
    }