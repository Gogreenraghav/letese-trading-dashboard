"""
Subscriptions Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Subscription, User, Plan
from app.auth import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("/my")
def get_my_subscription(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).order_by(Subscription.created_at.desc()).first()
    if not sub:
        return {"subscription": None, "message": "No active subscription"}
    
    return {
        "subscription": {
            "id": sub.id,
            "plan_name": sub.plan_name,
            "status": sub.status,
            "amount_paid": sub.amount_paid,
            "started_at": str(sub.started_at) if sub.started_at else None,
            "ends_at": str(sub.ends_at) if sub.ends_at else None,
            "billing_cycle": sub.billing_cycle,
        }
    }

@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).filter(Plan.is_active == True).all()
    return {"plans": [{
        "id": p.id, "name": p.name, "monthly_price": p.monthly_price,
        "yearly_price": p.yearly_price, "max_cases": p.max_cases,
        "max_advocates": p.max_advocates, "features": p.features
    } for p in plans]}

@router.post("/cancel")
def cancel_subscription(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found")
    sub.status = "cancelled"
    current_user.is_active = False
    db.commit()
    return {"message": "Subscription cancelled"}