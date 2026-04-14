"""
Payments Router - Razorpay Integration
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User, Subscription, Plan, ActivityLog
from app.auth import get_current_user
from app.utils.razorpay_utils import create_order, verify_payment_signature
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/payments", tags=["Payments"])

class CreateOrderRequest(BaseModel):
    plan_id: str
    billing_cycle: str = "monthly"

@router.post("/create-order")
def create_subscription_order(
    req: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(Plan).filter(Plan.id == req.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    amount = plan.monthly_price if req.billing_cycle == "monthly" else plan.yearly_price
    
    razorpay_order = create_order(
        amount=amount * 100,  # paise
        currency="INR",
        receipt=f"rcpt_{current_user.id[:8]}",
        notes={"user_id": current_user.id, "plan_id": req.plan_id, "billing_cycle": req.billing_cycle}
    )
    
    return {
        "razorpay_order_id": razorpay_order["id"],
        "amount": amount,
        "currency": "INR",
        "key": razorpay_order["key"],
    }

@router.post("/verify")
def verify_and_activate(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        verified = verify_payment_signature(
            razorpay_order_id=data["razorpay_order_id"],
            razorpay_payment_id=data["razorpay_payment_id"],
            razorpay_signature=data["razorpay_signature"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")
    
    # Activate subscription
    existing = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    
    if existing:
        existing.status = "active"
        existing.razorpay_order_id = data["razorpay_order_id"]
        existing.razorpay_subscription_id = data.get("razorpay_subscription_id")
        existing.started_at = datetime.utcnow()
        existing.ends_at = datetime.utcnow() + timedelta(days=30 if data.get("billing_cycle") == "monthly" else 365)
        existing.amount_paid = float(data.get("amount", 0)) / 100
    else:
        plan = db.query(Plan).filter(Plan.id == data.get("plan_id")).first()
        sub = Subscription(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            plan_id=data.get("plan_id"),
            plan_name=plan.name if plan else "Unknown",
            razorpay_order_id=data["razorpay_order_id"],
            razorpay_subscription_id=data.get("razorpay_subscription_id"),
            status="active",
            amount_paid=float(data.get("amount", 0)) / 100,
            started_at=datetime.utcnow(),
            ends_at=datetime.utcnow() + timedelta(days=30 if data.get("billing_cycle") == "monthly" else 365),
        )
        db.add(sub)
    
    current_user.is_active = True
    db.commit()
    
    log = ActivityLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        user_email=current_user.email,
        action="subscription_activated",
        details=f"Subscription activated via Razorpay",
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    
    return {"message": "Payment verified and subscription activated", "status": "active"}

@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).filter(Plan.is_active == True).all()
    return {"plans": plans}

@router.post("/webhook")
def razorpay_webhook(data: dict, db: Session = Depends(get_db)):
    event = data.get("event")
    payload = data.get("payload", {}).get("subscription", {})
    sub_id = payload.get("attributes", {}).get("id")
    
    if event == "subscription.activated":
        sub = db.query(Subscription).filter(Subscription.razorpay_subscription_id == sub_id).first()
        if sub:
            sub.status = "active"
            db.commit()
    
    elif event == "subscription.cancelled":
        sub = db.query(Subscription).filter(Subscription.razorpay_subscription_id == sub_id).first()
        if sub:
            sub.status = "cancelled"
            user = db.query(User).filter(User.id == sub.user_id).first()
            if user: user.is_active = False
            db.commit()
    
    return {"received": True}