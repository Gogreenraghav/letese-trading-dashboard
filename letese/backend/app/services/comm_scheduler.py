"""
LETESE● Communication Scheduler
Schedules WhatsApp/SMS/Email reminders based on next hearing date.
Creates entries in communication_schedule table.
"""
from datetime import datetime, timedelta, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import CommunicationSchedule, Case


async def schedule_hearing_reminders(
    db: AsyncSession,
    case: Case,
    next_hearing_at: datetime | None,
    tenant_id: UUID,
):
    """
    Schedule 4 reminder timestamps for a hearing:
    - reminder_15d: 15 days before
    - reminder_7d:  7 days before
    - reminder_48h: 48 hours before
    - reminder_24h: 24 hours before
    """
    if not next_hearing_at:
        return

    now = datetime.now(timezone.utc)
    reminder_offsets = [
        ("reminder_15d", timedelta(days=15)),
        ("reminder_7d", timedelta(days=7)),
        ("reminder_48h", timedelta(hours=48)),
        ("reminder_24h", timedelta(hours=24)),
    ]

    for msg_type, offset in reminder_offsets:
        scheduled_at = next_hearing_at - offset
        if scheduled_at > now:
            schedule = CommunicationSchedule(
                case_id=case.case_id,
                tenant_id=tenant_id,
                message_type=msg_type,
                scheduled_at=scheduled_at,
                channel="whatsapp",
                template_params={
                    "client_name": case.client_name.split()[0],
                    "case_title": case.case_title,
                    "hearing_date": next_hearing_at.strftime("%d %b %Y at %H:%M"),
                    "court_name": case.court_display_name or case.court_code,
                    "case_number": case.case_number or "",
                },
            )
            db.add(schedule)

    await db.commit()
