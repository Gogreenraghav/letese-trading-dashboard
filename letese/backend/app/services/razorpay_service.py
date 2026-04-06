"""
LETESE● Razorpay Service
Handles payment link creation, webhook verification, and payment captured processing.
"""
import hmac
import hashlib
import httpx
import json
from typing import Optional
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.config import settings


class RazorpayService:
    """Razorpay payment integration for LETESE billing."""

    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.base_url = "https://api.razorpay.com/v1"
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET if hasattr(settings, "RAZORPAY_WEBHOOK_SECRET") else ""

    def _auth_headers(self) -> dict:
        import base64
        credentials = f"{self.key_id}:{self.key_secret}"
        token = base64.b64encode(credentials.encode()).decode()
        return {"Authorization": f"Basic {token}", "Content-Type": "application/json"}

    async def create_payment_link(
        self,
        amount_inr: float,
        client_name: str,
        client_email: str,
        client_phone: str,
        description: str,
        invoice_id: str,
        callback_url: Optional[str] = None,
    ) -> str:
        """
        Create a Razorpay payment link.
        Returns the payment link URL.
        """
        payload = {
            "amount": int(amount_inr * 100),  # Razorpay uses paise
            "currency": "INR",
            "description": description,
            "customer": {
                "name": client_name,
                "email": client_email,
                "contact": client_phone,
            },
            "notify": {
                "sms": True,
                "email": True,
            },
            "reminder_enable": True,
            "notes": {
                "invoice_id": invoice_id,
                "product": "LETESE Legal SaaS",
            },
        }
        if callback_url:
            payload["callback_url"] = callback_url
            payload["callback_method"] = "get"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/payment_links",
                headers=self._auth_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("short_url") or data.get("url")

    async def create_subscription(
        self,
        customer_id: str,
        plan_id: str,
        total_count: int = 12,
        customer_notify: bool = True,
    ) -> dict:
        """
        Create a Razorpay subscription for recurring billing.
        Returns subscription details including the checkout URL.
        """
        payload = {
            "plan_id": plan_id,
            "customer_id": customer_id,
            "total_count": total_count,
            "customer_notify": customer_notify,
            "notify": {
                "sms": True,
                "email": True,
            },
            "notes": {
                "product": "LETESE Legal SaaS",
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/subscriptions",
                headers=self._auth_headers(),
                json=payload,
            )
            response.raise_for_status()
            return response.json()

    async def create_or_get_customer(
        self,
        name: str,
        email: str,
        phone: str,
        gstin: Optional[str] = None,
        customer_id: Optional[str] = None,
    ) -> str:
        """
        Create a Razorpay customer or return existing customer_id.
        Returns the Razorpay customer ID.
        """
        if customer_id:
            return customer_id

        payload = {
            "name": name,
            "email": email,
            "phone": phone,
        }
        if gstin:
            payload["gstin"] = gstin

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/customers",
                headers=self._auth_headers(),
                json=payload,
            )
            if response.status_code == 400:
                # Customer already exists — fetch by email
                fetch_resp = await client.get(
                    f"{self.base_url}/customers/{email}",
                    headers=self._auth_headers(),
                )
                fetch_resp.raise_for_status()
                return fetch_resp.json()["id"]
            response.raise_for_status()
            return response.json()["id"]

    async def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify Razorpay webhook HMAC-SHA256 signature.
        """
        if not self.webhook_secret:
            # In dev mode, skip verification
            return True
        expected = hmac.new(
            self.webhook_secret.encode(),
            payload,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def handle_payment_captured(
        self,
        event_data: dict,
        db: AsyncSession,
    ) -> dict:
        """
        Process payment_captured webhook:
        - Update invoice status to paid/partial
        - If subscription upgrade: update tenant plan
        - Send confirmation notification
        """
        from app.models.models import Invoice, Tenant
        from app.services.kafka_producer import publish_communication_dispatch

        payload = event_data.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id = payload.get("id")
        amount_paid = int(payload.get("amount", 0)) / 100  # Convert from paise
        invoice_id_str = payload.get("notes", {}).get("invoice_id")

        if not invoice_id_str:
            return {"status": "skipped", "reason": "No invoice_id in payment notes"}

        invoice_id = UUID(invoice_id_str)

        # Update invoice
        result = await db.execute(
            select(Invoice).where(Invoice.invoice_id == invoice_id)
        )
        invoice = result.scalar_one_or_none()

        if not invoice:
            return {"status": "error", "reason": "Invoice not found"}

        invoice.paid_inr = Decimal(str(amount_paid))
        invoice.razorpay_order_id = payment_id
        if Decimal(str(amount_paid)) >= invoice.total_inr:
            invoice.status = "paid"
        elif Decimal(str(amount_paid)) > 0:
            invoice.status = "partial"

        await db.commit()

        # Check for subscription upgrade in notes
        plan_upgrade = payload.get("notes", {}).get("plan_upgrade")
        if plan_upgrade:
            result = await db.execute(
                select(Tenant).where(Tenant.tenant_id == invoice.tenant_id)
            )
            tenant = result.scalar_one_or_none()
            if tenant:
                old_plan = tenant.plan
                tenant.plan = plan_upgrade
                await db.commit()
                return {
                    "status": "success",
                    "plan_upgrade": True,
                    "old_plan": old_plan,
                    "new_plan": plan_upgrade,
                    "invoice_id": str(invoice_id),
                }

        return {
            "status": "success",
            "invoice_id": str(invoice_id),
            "amount_paid": amount_paid,
        }

    async def create_upgrade_checkout_url(
        self,
        tenant_id: UUID,
        new_plan: str,
        amount_inr: float,
        tenant_name: str,
        tenant_email: str,
        tenant_phone: str,
        razorpay_customer_id: Optional[str] = None,
    ) -> dict:
        """
        Create a Razorpay payment link for plan upgrade.
        Returns {checkout_url, razorpay_customer_id}.
        """
        # Ensure customer exists in Razorpay
        customer_id = await self.create_or_get_customer(
            name=tenant_name,
            email=tenant_email,
            phone=tenant_phone,
            customer_id=razorpay_customer_id,
        )

        # Create one-time payment link for upgrade
        checkout_url = await self.create_payment_link(
            amount_inr=amount_inr,
            client_name=tenant_name,
            client_email=tenant_email,
            client_phone=tenant_phone,
            description=f"LETESE Plan Upgrade to {new_plan.capitalize()}",
            invoice_id=f"upgrade-{tenant_id}",
            callback_url=f"https://app.letese.xyz/admin/billing?upgrade=success&plan={new_plan}",
        )

        return {
            "checkout_url": checkout_url,
            "razorpay_customer_id": customer_id,
            "amount_inr": amount_inr,
            "plan": new_plan,
        }


razorpay_service = RazorpayService()
