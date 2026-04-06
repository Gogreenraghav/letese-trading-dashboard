"""
LETESE● Communications Endpoints
POST /api/v1/communications/trigger — Trigger WhatsApp/SMS/Email/AI Call
GET  /api/v1/inbox                  — Unified inbox (multi-channel)
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.services.auth_service import auth_service

router = APIRouter()


def get_user(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")
    return auth_service.verify_token(authorization[7:])


class TriggerCommRequest(BaseModel):
    case_id: Optional[UUID] = None
    channel: str  # whatsapp | sms | email | ai_call
    message_type: str  # reminder_15d | reminder_7d | reminder_48h | reminder_24h | order_alert | payment_reminder | document_chase
    recipient_phone: Optional[str] = None
    recipient_email: Optional[str] = None
    custom_message: Optional[str] = None
    template_params: Optional[dict] = None


class InboxItem(BaseModel):
    item_id: str
    channel: str
    case_id: Optional[str] = None
    case_title: Optional[str] = None
    sender: str
    message_preview: str
    urgency_score: int
    action_required: bool
    action_type: Optional[str] = None
    received_at: str
    is_read: bool = False


@router.post("/trigger")
async def trigger_communication(
    body: TriggerCommRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user),
):
    """
    Trigger outbound communication via WhatsApp, SMS, Email, or AI Voice Call.
    Enqueues job to letese.communications.dispatch Kafka topic.
    AIPOT-COMMUNICATOR picks it up and dispatches.
    """
    from app.services.kafka_producer import publish_communication_dispatch
    from app.models.models import Case

    # Get case details for template params
    case = None
    if body.case_id:
        case = await db.get(Case, body.case_id)
        if not case or str(case.tenant_id) != user["tenant_id"]:
            raise HTTPException(404, "Case not found")

    # Determine recipient
    recipient_phone = body.recipient_phone
    recipient_email = body.recipient_email
    if not recipient_phone and case:
        recipient_phone = case.client_whatsapp or case.client_phone
    if not recipient_email and case:
        recipient_email = case.client_email

    # Build template params
    template_params = body.template_params or {}
    if case:
        template_params.setdefault("case_title", case.case_title)
        template_params.setdefault("case_number", case.case_number or "")
        template_params.setdefault("court_name", case.court_display_name or case.court_code)
    template_params.setdefault("advocate_name", user.get("full_name", ""))

    # Publish to Kafka
    payload = {
        "case_id": str(body.case_id) if body.case_id else None,
        "tenant_id": user["tenant_id"],
        "message_type": body.message_type,
        "channel": body.channel,
        "recipient_phone": recipient_phone,
        "recipient_email": recipient_email,
        "template_params": template_params,
        "custom_message": body.custom_message,
        "priority": "high" if body.message_type in ("order_alert", "reminder_48h", "reminder_24h") else "normal",
    }

    await publish_communication_dispatch(payload)

    # Log the trigger in communication_schedule
    from app.models.models import CommunicationSchedule
    from datetime import datetime, timezone

    schedule = CommunicationSchedule(
        case_id=body.case_id,
        tenant_id=UUID(user["tenant_id"]),
        message_type=body.message_type,
        scheduled_at=datetime.now(timezone.utc),
        sent=True,
        sent_at=datetime.now(timezone.utc),
        channel=body.channel,
        template_params=template_params,
    )
    db.add(schedule)
    await db.commit()

    return {
        "message": f"{body.channel} dispatch queued",
        "channel": body.channel,
        "message_type": body.message_type,
    }


@router.get("/inbox")
async def get_inbox(
    tab: str = "all",  # urgent | action_needed | unread | all
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user),
):
    """
    Unified Inbox — all client messages + system notifications in one feed.
    AI-sorted by urgency. Returns items with urgency_score and action_required.
    """
    from app.models.models import CommunicationLog, Case
    from sqlalchemy import func, text

    tenant_id = UUID(user["tenant_id"])

    # Fetch communication logs
    query = select(
        CommunicationLog,
        Case.case_title,
    ).select_from(CommunicationLog).outerjoin(
        Case, Case.case_id == CommunicationLog.case_id
    ).where(
        and_(
            CommunicationLog.tenant_id == tenant_id,
        )
    ).order_by(desc(CommunicationLog.dispatched_at))

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    rows = result.fetchall()

    items = []
    for row in rows:
        log = row[0]
        case_title = row[1]

        # Calculate urgency score
        urgency = _calculate_urgency(log, case_title)
        action_required = _determine_action_required(log, case_title, user)

        item = {
            "item_id": str(log.log_id),
            "channel": log.channel,
            "case_id": str(log.case_id) if log.case_id else None,
            "case_title": case_title,
            "sender": log.recipient_phone or log.recipient_email or "unknown",
            "message_preview": (log.message_body or "")[:80],
            "urgency_score": urgency,
            "action_required": action_required,
            "action_type": _get_action_type(log),
            "delivery_status": log.delivery_status,
            "received_at": log.dispatched_at.isoformat() if log.dispatched_at else None,
            "is_read": log.delivery_status in ("delivered", "read"),
        }
        items.append(item)

    # Sort by urgency (highest first)
    items.sort(key=lambda x: x["urgency_score"], reverse=True)

    # Filter by tab
    if tab == "urgent":
        items = [i for i in items if i["urgency_score"] >= 8]
    elif tab == "action_needed":
        items = [i for i in items if i["action_required"]]
    elif tab == "unread":
        items = [i for i in items if not i["is_read"]]

    return {
        "items": items,
        "total": len(items),
        "tab": tab,
        "limit": limit,
        "offset": offset,
    }


def _calculate_urgency(log, case_title: str) -> int:
    """AI urgency scoring: 0-10 based on keywords, channel, timing."""
    score = 3  # base score

    msg_lower = (log.message_body or "").lower()
    urgent_keywords = ["urgent", "immediate", "deadline", "hearing tomorrow", "court order",
                       "rejoinder", "compliance", "failure"]
    for kw in urgent_keywords:
        if kw in msg_lower:
            score += 2

    if log.delivery_status == "failed":
        score += 3  # Failed delivery = needs attention

    if log.channel == "whatsapp":
        score += 1

    return min(score, 10)


def _determine_action_required(log, case_title: str, user: dict) -> bool:
    """Determine if this inbox item requires human action."""
    if log.delivery_status == "failed":
        return True
    msg_lower = (log.message_body or "").lower()
    action_keywords = ["reply", "confirm", "send documents", "submit", "file"]
    return any(kw in msg_lower for kw in action_keywords)


def _get_action_type(log) -> Optional[str]:
    """Map communication to required action type."""
    if log.delivery_status == "failed":
        return "RESEND"
    msg_lower = (log.message_body or "").lower()
    if "confirm" in msg_lower or "confirmed" in msg_lower:
        return "REPLY_CLIENT"
    if "document" in msg_lower:
        return "REVIEW_DOCUMENT"
    if "hearing" in msg_lower:
        return "COURT_DATE_CHANGE"
    if "payment" in msg_lower:
        return "PAYMENT_RECEIVED"
    return "NO_ACTION"
