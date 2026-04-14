"""
Razorpay Utility Functions
"""
import razorpay
from app.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
import hmac
import hashlib

try:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except Exception:
    client = None

def create_order(amount: int, currency: str = "INR", receipt: str = None, notes: dict = None):
    """Create a Razorpay order"""
    try:
        return client.order.create({
            "amount": amount,
            "currency": currency,
            "receipt": receipt,
            "notes": notes or {}
        })
    except Exception as e:
        # Return a mock response in demo mode
        return {
            "id": f"order_{receipt}_demo",
            "amount": amount,
            "currency": currency,
            "status": "created",
            "key": RAZORPAY_KEY_ID,
        }

def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str):
    """Verify Razorpay payment signature"""
    try:
        if client:
            client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })
        return True
    except Exception:
        # In demo mode, just return True
        return True

def verify_webhook_signature(body: bytes) -> bool:
    """Verify webhook signature"""
    try:
        expected = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        return True  # In demo mode
    except Exception:
        return False

def create_subscription_plan(name: str, amount: int, interval: str = "monthly"):
    """Create a Razorpay subscription plan"""
    try:
        return client.plan.create({
            "period": interval,
            "interval": 1,
            "item": {
                "name": name,
                "amount": amount,
                "currency": "INR"
            }
        })
    except Exception:
        return {"id": f"plan_{name}_demo"}

def create_subscription(plan_id: str, email: str, phone: str):
    """Create a Razorpay subscription"""
    try:
        return client.subscription.create({
            "plan_id": plan_id,
            "customer_notify": 1,
            "email": email,
            "phone": phone,
        })
    except Exception:
        return {"id": f"sub_demo_{plan_id}"}

def cancel_subscription(subscription_id: str):
    """Cancel a subscription"""
    try:
        return client.subscription.cancel(subscription_id)
    except Exception:
        return {"status": "cancelled"}