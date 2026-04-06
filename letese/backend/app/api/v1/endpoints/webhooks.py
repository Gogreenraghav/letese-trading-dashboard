"""
LETESE● Razorpay Webhook Handler
POST /webhooks/razorpay — Handles payment.captured, payment.failed, subscription.activated
Verifies HMAC-SHA256 signature before processing.
"""
from fastapi import APIRouter, Request, HTTPException
import hmac
import hashlib
from app.core.config import settings
from app.services.razorpay_service import RazorpayService

router = APIRouter()
razorpay = RazorpayService()

WEBHOOK_EVENTS = {
    "payment.captured": "handle_payment_captured",
    "payment.failed": "handle_payment_failed",
    "subscription.activated": "handle_subscription_activated",
    "subscription.cancelled": "handle_subscription_cancelled",
}


@router.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    """
    Razorpay sends signed webhook events.
    1. Read raw body
    2. Verify signature
    3. Route to appropriate handler
    4. Return 200 quickly (Razorpay expects < 5s)
    """
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    # Verify signature
    if not razorpay.verify_webhook_signature(body, signature):
        raise HTTPException(400, "Invalid webhook signature")

    import json
    event = json.loads(body)
    event_type = event.get("event", "")
    payload = event.get("payload", {})

    handler_name = WEBHOOK_EVENTS.get(event_type)
    if handler_name:
        handler = getattr(razorpay, handler_name, None)
        if handler:
            await handler(payload)

    return {"status": "received"}


@router.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request):
    """
    360dialog WhatsApp webhook.
    Handles: incoming messages, delivery status updates.
    """
    import json
    from app.services.notification_service import NotificationService
    from app.db.database import get_db

    body = await request.json()
    notifications = NotificationService()

    # Process incoming messages
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})

            # Delivery status updates
            for status in value.get("statuses", []):
                msg_id = status.get("id")
                new_status = status.get("status")  # sent|delivered|read|failed
                await notifications.handle_wa_delivery_update(msg_id, new_status)

            # Incoming messages
            for msg in value.get("messages", []):
                phone = msg.get("from")
                text = msg.get("text", {}).get("body", "").lower().strip()
                await notifications.handle_wa_incoming_message(phone, text, msg.get("id"))

    return {"status": "ok"}


@router.post("/webhooks/exotel/call-status")
async def exotel_call_status(request: Request):
    """Exotel call status webhook."""
    import json
    body = await request.json()
    call_sid = body.get("CallSid")
    status = body.get("Status")  # completed|no-answer|busy|failed
    # Update call record in DB
    return {"status": "ok"}


@router.get("/webhooks/exotel/call-flow")
async def exotel_call_flow(
    caller: str,
    called: str,
    CallSid: str = "",
):
    """Exotel IVR call flow — returns TwiML XML."""
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="woman" language="en-IN">Namaste. Welcome to LETESE Legal. Please hold while we connect your call.</Say>
    <Dial timeout="30" record="true" callerId="{settings.EXOTEL_CALLER_ID or '+919876543210'}">
        <Number>{called}</Number>
    </Dial>
    <Say voice="woman" language="en-IN">The call could not be completed. Please try again or call our main line.</Say>
</Response>"""
    from fastapi.responses import Response
    return Response(content=xml, media_type="application/xml")
