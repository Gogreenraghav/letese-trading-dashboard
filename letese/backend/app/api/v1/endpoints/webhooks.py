"""
LETESE● Webhook Handler
MODULE E-CA: Razorpay webhook endpoint.
POST /api/v1/webhooks/razorpay — Receive and process Razorpay events
"""
import json
import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db, async_session_factory
from app.services.razorpay_service import razorpay_service

router = APIRouter(prefix="/api/v1/webhooks", tags=["Webhooks"])


@router.post("/razorpay")
async def razorpay_webhook(request: Request):
    """
    Receive and process Razorpay webhook events.
    Returns 200 quickly to avoid Razorpay retries.
    """
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    # Verify webhook signature
    is_valid = await razorpay_service.verify_webhook_signature(body, signature)
    if not is_valid:
        raise HTTPException(400, "Invalid webhook signature")

    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON payload")

    event_type = event.get("event", "")

    # Route events
    if event_type == "payment.captured":
        async with async_session_factory() as db:
            await razorpay_service.handle_payment_captured(event, db)
        return {"status": "ok", "processed": True}

    elif event_type == "payment.failed":
        # Log payment failure — update invoice status
        payload = event.get("payload", {}).get("payment", {}).get("entity", {})
        invoice_id_str = payload.get("notes", {}).get("invoice_id")
        if invoice_id_str:
            from uuid import UUID
            from app.models.models import Invoice
            from sqlalchemy import update
            async with async_session_factory() as db:
                await db.execute(
                    update(Invoice)
                    .where(Invoice.invoice_id == UUID(invoice_id_str))
                    .values(status="failed")
                )
                await db.commit()
        return {"status": "ok", "processed": False, "reason": "payment_failed"}

    elif event_type == "subscription.activated":
        # Handle subscription renewal
        return {"status": "ok", "processed": True, "event": "subscription.activated"}

    elif event_type == "subscription.cancelled":
        # Downgrade tenant to basic on cancellation
        from uuid import UUID
        from app.models.models import Tenant
        from sqlalchemy import update

        entity = event.get("payload", {}).get("subscription", {}).get("entity", {})
        customer_id = entity.get("customer_id")
        if customer_id:
            async with async_session_factory() as db:
                await db.execute(
                    update(Tenant)
                    .where(Tenant.razorpay_customer_id == customer_id)
                    .values(plan="basic")
                )
                await db.commit()
        return {"status": "ok", "processed": True, "event": "subscription.cancelled"}

    # Unhandled event types — acknowledge and ignore
    return {"status": "ok", "processed": False, "reason": "unhandled_event"}
