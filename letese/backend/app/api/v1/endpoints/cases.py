"""
LETESE● Cases Endpoints
GET  /api/v1/cases — List cases (filterable, searchable)
POST /api/v1/cases — Create new case
GET  /api/v1/cases/{id} — Case detail (hearings, orders, docs, tasks)
PUT  /api/v1/cases/{id} — Update case
DELETE /api/v1/cases/{id} — Soft delete case
POST /api/v1/cases/{id}/scrape — Trigger AIPOT-SCRAPER job
GET  /api/v1/cases/{id}/diary — Full case diary
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, and_, or_
from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.db.database import get_db

router = APIRouter()


def get_user_from_token(authorization: str = Header(...)) -> dict:
    """Extract and verify JWT payload from Authorization header."""
    from app.services.auth_service import auth_service
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")
    token = authorization[7:]
    try:
        return auth_service.verify_token(token)
    except ValueError as e:
        raise HTTPException(401, str(e))


class CaseCreate(BaseModel):
    case_title: str
    court_code: str
    petition_type: Optional[str] = None
    case_number: Optional[str] = None
    client_name: str
    client_phone: str
    client_email: Optional[str] = None
    client_whatsapp: Optional[str] = None
    next_hearing_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "case_title": "Sharma v. Union of India",
                "court_code": "PHAHC",
                "petition_type": "CWP",
                "client_name": "Rajinder Sharma",
                "client_phone": "+919876543210",
            }
        }


class CaseUpdate(BaseModel):
    case_title: Optional[str] = None
    petition_type: Optional[str] = None
    case_number: Optional[str] = None
    status: Optional[str] = None
    urgency_level: Optional[str] = None
    next_hearing_at: Optional[datetime] = None
    notes: Optional[str] = None


COURT_NAMES = {
    "PHAHC": "Punjab & Haryana High Court",
    "DHC": "Delhi High Court",
    "SC": "Supreme Court of India",
    "NCDRC": "NCDRC",
    "CHD_DC": "Chandigarh District Courts",
    "CONSUMER_PH": "Punjab Consumer Forums",
    "TIS_HAZ": "Tis Hazari District Court",
    "SAKET": "Saket District Court",
}


@router.get("")
async def list_cases(
    status: Optional[str] = Query(None),
    court_code: Optional[str] = Query(None),
    search: Optional[str] = Query(None, min_length=2),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_from_token),
):
    """List cases for the authenticated tenant."""
    tenant_id = user["tenant_id"]
    role = user["role"]

    query = select(
        func.jsonb_build_object(
            "case_id", Case.case_id,
            "case_title", Case.case_title,
            "court_code", Case.court_code,
            "status", Case.status,
            "urgency_level", Case.urgency_level,
            "next_hearing_at", Case.next_hearing_at,
            "client_name", Case.client_name,
        )
    ).select_from(Case).where(
        and_(
            Case.tenant_id == UUID(tenant_id),
            Case.deleted_at.is_(None),
        )
    )

    if status:
        query = query.where(Case.status == status)
    if court_code:
        query = query.where(Case.court_code == court_code)
    if search:
        query = query.where(
            or_(
                Case.case_title.ilike(f"%{search}%"),
                Case.client_name.ilike(f"%{search}%"),
            )
        )

    # Non-admin roles can only see their own assigned cases
    if role not in ("admin", "super_admin"):
        query = query.where(Case.assigned_user_id == UUID(user["sub"]))

    query = query.order_by(Case.next_hearing_at.asc().nullslast())
    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    rows = result.fetchall()

    return {
        "cases": [row[0] for row in rows],
        "total": len(rows),
        "limit": limit,
        "offset": offset,
    }


@router.post("")
async def create_case(
    body: CaseCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_from_token),
):
    """Create a new case. Enforces plan case limits."""
    from app.models.models import Tenant, Case
    from app.services.kafka_producer import publish_scrape_job

    tenant_id = UUID(user["tenant_id"])
    plan = user["plan"]

    # Check plan limits
    tenant_result = await db.execute(select(Tenant).where(Tenant.tenant_id == tenant_id))
    tenant = tenant_result.scalar_one()

    plan_limits = {"basic": 30, "professional": 200, "elite": 500, "enterprise": 999999}
    limit = plan_limits.get(plan, 30)

    if tenant.cases_active_count >= limit:
        raise HTTPException(
            402,
            {"upgrade_required": True, "current_plan": plan,
             "limit": limit, "message": f"Case limit reached. Upgrade to {plan} to add more."}
        )

    # Create case
    court_display = COURT_NAMES.get(body.court_code, body.court_code)
    case = Case(
        tenant_id=tenant_id,
        assigned_user_id=UUID(user["sub"]),
        case_title=body.case_title,
        court_code=body.court_code,
        court_display_name=court_display,
        petition_type=body.petition_type,
        case_number=body.case_number,
        client_name=body.client_name,
        client_phone=body.client_phone,
        client_email=body.client_email,
        client_whatsapp=body.client_whatsapp or body.client_phone,
        next_hearing_at=body.next_hearing_at,
        notes=body.notes,
        status="active",
    )
    db.add(case)

    # Increment tenant case count
    tenant.cases_active_count += 1

    # Schedule hearing reminders if next_hearing_at set
    from app.services.comm_scheduler import schedule_hearing_reminders
    await schedule_hearing_reminders(db, case, body.next_hearing_at, tenant_id)

    await db.commit()
    await db.refresh(case)

    # Trigger scraper if enabled
    if tenant.scraper_enabled and body.case_number:
        await publish_scrape_job({
            "case_id": str(case.case_id),
            "court_code": body.court_code,
            "case_number": body.case_number,
            "tenant_id": str(tenant_id),
            "client_phone": body.client_phone,
            "client_name": body.client_name,
            "case_title": body.case_title,
            "advocate_name": user.get("full_name", ""),
        })

    return {
        "case_id": str(case.case_id),
        "case_title": case.case_title,
        "court_display_name": court_display,
        "created_at": case.created_at.isoformat(),
    }


@router.get("/{case_id}")
async def get_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_from_token),
):
    """Get full case detail with hearings, orders, documents, tasks."""
    from app.models.models import Case, CaseHearing, Document, Task

    result = await db.execute(
        select(Case).where(
            and_(Case.case_id == case_id, Case.tenant_id == UUID(user["tenant_id"]))
        )
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(404, "Case not found")

    # Fetch related data
    hearings = await db.execute(
        select(CaseHearing)
        .where(CaseHearing.case_id == case_id)
        .order_by(CaseHearing.hearing_date.desc())
        .limit(20)
    )
    docs = await db.execute(
        select(Document)
        .where(and_(Document.case_id == case_id, Document.deleted_at.is_(None)))
        .order_by(Document.created_at.desc())
    )
    tasks_q = await db.execute(
        select(Task)
        .where(Task.case_id == case_id)
        .order_by(Task.due_date.asc())
    )

    return {
        "case_id": str(case.case_id),
        "case_title": case.case_title,
        "case_number": case.case_number,
        "court_code": case.court_code,
        "court_display_name": case.court_display_name,
        "status": case.status,
        "urgency_level": case.urgency_level,
        "client_name": case.client_name,
        "client_phone": case.client_phone,
        "client_email": case.client_email,
        "next_hearing_at": case.next_hearing_at.isoformat() if case.next_hearing_at else None,
        "last_order_text": case.last_order_text,
        "last_order_date": str(case.last_order_date) if case.last_order_date else None,
        "last_order_summary": case.last_order_summary,
        "notes": case.notes,
        "created_at": case.created_at.isoformat(),
        "hearings": [dict(row._mapping) for row in hearings],
        "documents": [dict(row._mapping) for row in docs],
        "tasks": [dict(row._mapping) for row in tasks_q],
    }


@router.put("/{case_id}")
async def update_case(
    case_id: UUID,
    body: CaseUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_from_token),
):
    from app.models.models import Case
    from sqlalchemy import update

    result = await db.execute(
        select(Case).where(
            and_(Case.case_id == case_id, Case.tenant_id == UUID(user["tenant_id"]))
        )
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(404, "Case not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(case, key, value)
    case.updated_at = datetime.now(timezone.utc)

    await db.commit()
    return {"message": "Case updated", "case_id": str(case_id)}


@router.delete("/{case_id}")
async def delete_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_from_token),
):
    """Soft delete — sets deleted_at timestamp."""
    from app.models.models import Case, Tenant
    from sqlalchemy import update

    result = await db.execute(
        select(Case).where(
            and_(Case.case_id == case_id, Case.tenant_id == UUID(user["tenant_id"]))
        )
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(404, "Case not found")

    case.deleted_at = datetime.now(timezone.utc)
    case.status = "archived"
    tenant = await db.get(Tenant, case.tenant_id)
    if tenant and tenant.cases_active_count > 0:
        tenant.cases_active_count -= 1

    await db.commit()
    return {"message": "Case archived", "case_id": str(case_id)}


@router.post("/{case_id}/scrape")
async def trigger_scrape(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user_from_token),
):
    """Manually trigger AIPOT-SCRAPER for a case."""
    from app.models.models import Case
    from app.services.kafka_producer import publish_scrape_job

    result = await db.execute(
        select(Case).where(
            and_(Case.case_id == case_id, Case.tenant_id == UUID(user["tenant_id"]))
        )
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(404, "Case not found")

    await publish_scrape_job({
        "case_id": str(case.case_id),
        "court_code": case.court_code,
        "case_number": case.case_number or "",
        "tenant_id": user["tenant_id"],
        "client_phone": case.client_phone,
        "client_name": case.client_name,
        "case_title": case.case_title,
        "advocate_name": user.get("full_name", ""),
        "priority": "high" if case.urgency_level in ("critical", "high") else "normal",
    })

    return {"message": "Scrape job queued", "case_id": str(case_id)}
