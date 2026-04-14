"""
Subscription Plans & Razorpay Integration
"""
import os
import hmac
import hashlib
import time
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False

from ..database import get_db
from ..models import User
from ..auth.utils import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

# ─── Plan Config ───────────────────────────────────────────────

PLANS = {
    "free": {
        "name": "Free",
        "price": 0,
        "price_id": None,
        "features": ["Dashboard view", "Paper trading", "5 stocks watchlist", "1 strategy", "Telegram alerts"],
        "max_stocks": 5,
        "max_strategies": 1,
        "live_trading": False,
    },
    "basic": {
        "name": "Basic",
        "price": 499,
        "price_id": "plan_basic_monthly",
        "features": ["Everything in Free", "20 stocks watchlist", "All NSE stocks", "Email support", "Basic AI signals"],
        "max_stocks": 20,
        "max_strategies": 1,
        "live_trading": False,
    },
    "pro": {
        "name": "Pro",
        "price": 1999,
        "price_id": "plan_pro_monthly",
        "features": ["Everything in Basic", "50 stocks watchlist", "5 strategies", "Live trading (Zerodha)", "Priority support", "Advanced AI", "Backtesting"],
        "max_stocks": 50,
        "max_strategies": 5,
        "live_trading": True,
    },
    "enterprise": {
        "name": "Enterprise",
        "price": 4999,
        "price_id": "plan_enterprise_monthly",
        "features": ["Everything in Pro", "Unlimited stocks", "All strategies", "White-label", "Multiple users", "Custom indicators", "Dedicated support"],
        "max_stocks": 200,
        "max_strategies": 10,
        "live_trading": True,
    },
}


class PlanSchema(BaseModel):
    id: str
    name: str
    price: int
    features: List[str]
    max_stocks: int
    max_strategies: int
    live_trading: bool


@router.get("/plans", response_model=List[PlanSchema])
def list_plans():
    """Get all subscription plans"""
    return [
        PlanSchema(id=k, name=v["name"], price=v["price"],
                   features=v["features"], max_stocks=v["max_stocks"],
                   max_strategies=v["max_strategies"], live_trading=v["live_trading"])
        for k, v in PLANS.items()
    ]


@router.get("/plans/{plan_id}")
def get_plan(plan_id: str):
    """Get a specific plan"""
    if plan_id not in PLANS:
        raise HTTPException(status_code=404, detail="Plan not found")
    v = PLANS[plan_id]
    return PlanSchema(id=plan_id, name=v["name"], price=v["price"],
                      features=v["features"], max_stocks=v["max_stocks"],
                      max_strategies=v["max_strategies"], live_trading=v["live_trading"])


@router.post("/checkout")
def create_checkout(
    plan_id: str,
    current_user: User = Depends(get_current_user),
):
    """Create Razorpay checkout session for plan upgrade"""
    if plan_id not in PLANS:
        raise HTTPException(status_code=404, detail="Plan not found")

    if plan_id == "free":
        raise HTTPException(status_code=400, detail="Free plan doesn't need checkout")

    plan = PLANS[plan_id]

    if not RAZORPAY_AVAILABLE:
        # Demo mode — return mock checkout
        return {
            "mode": "demo",
            "plan": plan_id,
            "amount": plan["price"] * 100,  # paise
            "currency": "INR",
            "description": f"LETESE Trading Bot - {plan['name']} Plan",
            "user_email": current_user.email,
            "user_name": current_user.full_name,
            "checkout_url": "https://razorpay.com/demo-checkout",
            "note": "Razorpay not configured — this is a demo response",
        }

    razorpay_key = os.getenv("RAZORPAY_KEY_ID")
    razorpay_secret = os.getenv("RAZORPAY_KEY_SECRET")

    client = razorpay.Client(auth=(razorpay_key, razorpay_secret))

    # Create customer if not exists
    if not current_user.razorpay_customer_id:
        customer = client.customer.create({
            "name": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone or None,
        })
        current_user.razorpay_customer_id = customer["id"]

    # Create order
    order = client.order.create({
        "amount": plan["price"] * 100,  # paise
        "currency": "INR",
        "customer_id": current_user.razorpay_customer_id,
        "notes": {
            "user_id": str(current_user.id),
            "plan": plan_id,
        },
        "receipt": f"rcpt_{current_user.id}_{int(time.time())}",
    })

    return {
        "mode": "live",
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": razorpay_key,
        "user_name": current_user.full_name,
        "user_email": current_user.email,
    }


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Razorpay webhook events"""
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature")
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

    # Verify signature
    if webhook_secret:
        expected = hmac.new(
            webhook_secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        if signature != expected:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json
    payload = json.loads(body)
    event = payload.get("event")
    payload_data = payload.get("payload", {})

    if event == "payment.captured":
        order = payload_data.get("order", {}).get("entity", {})
        notes = order.get("notes", {})
        user_id = notes.get("user_id")

        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                plan = notes.get("plan", "basic")
                if plan in PLANS:
                    from datetime import date, timedelta
                    from ..admin.router import get_admin_user
                    user.plan = plan
                    user.subscription_id = order.get("id")
                    user.subscription_status = "active"
                    user.subscription_start = date.today()
                    user.subscription_end = date.today() + timedelta(days=30)
                    user.max_stocks = PLANS[plan]["max_stocks"]
                    user.max_strategies = PLANS[plan]["max_strategies"]
                    user.live_trading = PLANS[plan]["live_trading"]
                    db.commit()

    elif event == "subscription.cancelled":
        sub_id = payload_data.get("subscription", {}).get("entity", {}).get("id")
        user = db.query(User).filter(User.subscription_id == sub_id).first()
        if user:
            user.subscription_status = "cancelled"
            user.plan = "free"
            db.commit()

    return {"status": "ok"}


@router.post("/subscribe/{plan_id}")
def subscribe_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manual subscribe (for testing / demo without Razorpay)"""
    if plan_id not in PLANS:
        raise HTTPException(status_code=404, detail="Plan not found")

    from datetime import date, timedelta
    plan = PLANS[plan_id]
    current_user.plan = plan_id
    current_user.subscription_status = "active"
    current_user.subscription_start = date.today()
    current_user.subscription_end = date.today() + timedelta(days=30)
    current_user.max_stocks = plan["max_stocks"]
    current_user.max_strategies = plan["max_strategies"]
    current_user.live_trading = plan["live_trading"]
    db.commit()

    return {
        "message": f"Subscribed to {plan['name']} plan",
        "plan": plan_id,
        "subscription_end": str(current_user.subscription_end),
    }


@router.post("/cancel")
def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel current subscription"""
    if current_user.plan == "free":
        raise HTTPException(status_code=400, detail="Already on free plan")

    current_user.subscription_status = "cancelled"
    current_user.plan = "free"
    current_user.max_stocks = 5
    current_user.max_strategies = 1
    current_user.live_trading = False
    db.commit()

    return {"message": "Subscription cancelled. Reverted to Free plan."}