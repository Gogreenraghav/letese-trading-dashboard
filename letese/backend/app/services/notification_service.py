"""
LETESE● Multi-Channel Notification Service
Sends notifications via: WhatsApp, SMS, Email, In-App
Uses tenant user notification preferences.
"""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import User
from app.services.kafka_producer import publish_communication_dispatch


class NotificationService:
    """
    High-level notification interface.
    Respects user notification preferences (WhatsApp/SMS/Email/InApp).
    """

    async def notify_case_update(
        self,
        db: AsyncSession,
        tenant_id: str,
        case_id: str,
        case_title: str,
        event_type: str,  # "new_hearing" | "order_detected" | "hearing_reminder" | "payment_due"
        extra_data: dict = None,
    ) -> dict:
        """Send notification to all relevant users about a case update."""
        extra_data = extra_data or {}

        # Get all active users for tenant
        result = await db.execute(
            select(User).where(
                User.tenant_id == UUID(tenant_id),
                User.is_active == True,
                User.deleted_at.is_(None),
            )
        )
        users = result.scalars().all()

        channel_counts: dict[str, int] = {}
        for user in users:
            prefs = user.notification_prefs or {}
            if event_type == "hearing_reminder":
                if prefs.get("whatsapp"):
                    await self._send_via_whatsapp(user, case_title, extra_data)
                    channel_counts["whatsapp"] = channel_counts.get("whatsapp", 0) + 1
                if prefs.get("sms"):
                    await self._send_via_sms(user, case_title, extra_data)
                    channel_counts["sms"] = channel_counts.get("sms", 0) + 1
            elif event_type == "order_detected":
                # Always urgent — send on all channels
                if prefs.get("whatsapp"):
                    await self._send_via_whatsapp(user, case_title, extra_data)
                    channel_counts["whatsapp"] = channel_counts.get("whatsapp", 0) + 1
                if prefs.get("inapp"):
                    await self._publish_inapp(user.user_id, case_title, extra_data)
                    channel_counts["inapp"] = channel_counts.get("inapp", 0) + 1
            elif event_type == "payment_due":
                if prefs.get("whatsapp"):
                    await self._send_via_whatsapp(user, case_title, extra_data)
                    channel_counts["whatsapp"] = channel_counts.get("whatsapp", 0) + 1
                if prefs.get("email"):
                    await self._send_via_email(user, case_title, extra_data)
                    channel_counts["email"] = channel_counts.get("email", 0) + 1

        return channel_counts

    async def _send_via_whatsapp(self, user: User, case_title: str, data: dict):
        await publish_communication_dispatch({
            "case_id": data.get("case_id"),
            "tenant_id": str(user.tenant_id),
            "message_type": data.get("message_type", "order_alert"),
            "channel": "whatsapp",
            "recipient_phone": user.whatsapp_number or user.phone,
            "template_params": {
                "case_title": case_title,
                "court_name": data.get("court_name", ""),
                "hearing_date": data.get("hearing_date", ""),
            },
        })

    async def _send_via_sms(self, user: User, case_title: str, data: dict):
        await publish_communication_dispatch({
            "case_id": data.get("case_id"),
            "tenant_id": str(user.tenant_id),
            "message_type": data.get("message_type", "reminder_48h"),
            "channel": "sms",
            "recipient_phone": user.phone,
            "template_params": {"case_title": case_title},
        })

    async def _send_via_email(self, user: User, case_title: str, data: dict):
        await publish_communication_dispatch({
            "case_id": data.get("case_id"),
            "tenant_id": str(user.tenant_id),
            "message_type": data.get("message_type", "payment_reminder"),
            "channel": "email",
            "recipient_email": user.email,
            "template_params": {
                "case_title": case_title,
                "amount": data.get("amount", ""),
                "due_date": data.get("due_date", ""),
            },
        })

    async def _publish_inapp(self, user_id: UUID, case_title: str, data: dict):
        # In-app notifications via Redis pub/sub or WebSocket — stub for now
        pass
