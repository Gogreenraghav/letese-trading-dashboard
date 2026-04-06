"""
LETESE● Seed Data
MODULE A: Database — Day 1 Demo Data
Inserts court checklists, demo tenant, demo users, and sample cases.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    Tenant, User, Case, CourtChecklist,
)


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas for seed data (validated before insert)
# ─────────────────────────────────────────────────────────────────────────────

class CourtChecklistData(BaseModel):
    court_code: str
    petition_type: str
    effective_date: str  # ISO date string e.g. "2024-01-01"
    rules: list[dict[str, Any]]


class DemoTenantData(BaseModel):
    name: str = "Sharma & Associates"
    plan: str = "basic"
    email: str = "demo@sharma-associates.in"
    phone: str = "+919876543210"
    bar_enrolment_no: str = "PB/2020/12345"
    gstin: str = "03AAACH1234P1Z5"
    firm_address: str = "SCO 12, Sector 17-D, Chandigarh 160017"


class DemoUserData(BaseModel):
    full_name: str
    email: str
    phone: str
    role: str  # admin | advocate
    password_plain: str = Field(description="Plain text — hashed before storage")


class SampleCaseData(BaseModel):
    case_number: str
    case_title: str
    court_code: str
    court_display_name: str
    petition_type: str
    client_name: str
    client_phone: str
    client_email: str
    status: str = "active"
    urgency_level: str = "medium"
    next_hearing_days: int = Field(default=14, description="Days from now for next hearing")


# ─────────────────────────────────────────────────────────────────────────────
# Court checklist rules (realistic JSON per petition type)
# ─────────────────────────────────────────────────────────────────────────────

PHAHC_CHECKLIST_COMMON = [
    {"step": 1, "label": "Prepare typedpetition in quadruplicate", "required": True, "days_before": 7},
    {"step": 2, "label": "Attach attested copies of impugned orders/judgments", "required": True, "days_before": 7},
    {"step": 3, "label": "File Caveat (if applicable)", "required": False, "days_before": 5},
    {"step": 4, "label": "Prepare Index of Documents", "required": True, "days_before": 5},
    {"step": 5, "label": "PrepareSynopsis (3 copies)", "required": True, "days_before": 5},
    {"step": 6, "label": "Prepare List of Dates", "required": True, "days_before": 5},
    {"step": 7, "label": "Annex A4-filewrapper papers paginated", "required": True, "days_before": 5},
    {"step": 8, "label": "Draft Vakalatnama (stamped)", "required": True, "days_before": 1},
    {"step": 9, "label": "Submit at Filing Counter, get Diary No.", "required": True, "days_before": 0},
    {"step": 10, "label": "Track status on PHAHC website within 3 days", "required": False, "days_before": -3},
]

DHC_CHECKLIST_COMMON = [
    {"step": 1, "label": "Prepare signedpetition with verification clause", "required": True, "days_before": 10},
    {"step": 2, "label": "Attach self-attested copies of documents", "required": True, "days_before": 10},
    {"step": 3, "label": "Prepare Grounds of Writ", "required": True, "days_before": 7},
    {"step": 4, "label": "Prepare Affidavit of Truth", "required": True, "days_before": 7},
    {"step": 5, "label": "File Caveat (if adverse party may appear)", "required": False, "days_before": 5},
    {"step": 6, "label": "Prepare Chronological List of Events", "required": True, "days_before": 5},
    {"step": 7, "label": "Draft Memorandum of Parties", "required": True, "days_before": 5},
    {"step": 8, "label": "Submit at Filing Counter — receive Acknowledgment", "required": True, "days_before": 0},
]

SC_CHECKLIST_COMMON = [
    {"step": 1, "label": "Review certiorari jurisdiction under Art. 32 / SLP under Art. 136", "required": True, "days_before": 21},
    {"step": 2, "label": "Obtain certified/attested copies of impugned order", "required": True, "days_before": 21},
    {"step": 3, "label": "Prepare SLP Petition / WPC (typed, A4, double line spacing)", "required": True, "days_before": 14},
    {"step": 4, "label": "Attach Judgment/Order being challenged (certified copy)", "required": True, "days_before": 14},
    {"step": 5, "label": "Prepare Grounds of Appeal with specific grounds", "required": True, "days_before": 10},
    {"step": 6, "label": "Draft Brief (for SLP) / Petition contents sheet", "required": True, "days_before": 10},
    {"step": 7, "label": "File Caveat at SC (within 90 days of order)", "required": False, "days_before": 5},
    {"step": 8, "label": "Submit petition at Filing Counter, pay court fees", "required": True, "days_before": 0},
    {"step": 9, "label": "Check Diary No. on SCI website within 5 working days", "required": True, "days_before": -5},
]


# ─────────────────────────────────────────────────────────────────────────────
# Seed Data Collections
# ─────────────────────────────────────────────────────────────────────────────

COURT_CHECKLISTS: list[CourtChecklistData] = [
    # PHAHC
    CourtChecklistData(court_code="PHAHC", petition_type="CWP",
                       effective_date="2024-01-01",
                       rules=PHAHC_CHECKLIST_COMMON + [
                           {"step": 11, "label": "Submit to PHAHC Counter — Punjab & Haryana HC", "required": True, "days_before": 0}
                       ]),
    CourtChecklistData(court_code="PHAHC", petition_type="SLP",
                       effective_date="2024-01-01",
                       rules=SC_CHECKLIST_COMMON + [
                           {"step": 10, "label": "Covering letter addressed to SC Registry via PHAHC", "required": True, "days_before": 0}
                       ]),
    CourtChecklistData(court_code="PHAHC", petition_type="CS",
                       effective_date="2024-01-01",
                       rules=[
                           *PHAHC_CHECKLIST_COMMON[:5],
                           {"step": 6, "label": "Prepare Written Statement (file within 30 days)", "required": True, "days_before": 0},
                           {"step": 7, "label": "Prepare Replication if WS filed", "required": False, "days_before": 0},
                           {"step": 8, "label": "Submit at PHAHC Civil Section", "required": True, "days_before": 0},
                       ]),
    CourtChecklistData(court_code="PHAHC", petition_type="WP",
                       effective_date="2024-01-01",
                       rules=PHAHC_CHECKLIST_COMMON + [
                           {"step": 11, "label": "Verify PIL public interest criteria", "required": True, "days_before": 0},
                           {"step": 12, "label": "Submit at PHAHC PIL Cell", "required": True, "days_before": 0},
                       ]),
    # DHC
    CourtChecklistData(court_code="DHC", petition_type="CWP",
                       effective_date="2024-01-01",
                       rules=DHC_CHECKLIST_COMMON + [
                           {"step": 9, "label": "Submit at DHC Filing Counter — Delhi High Court", "required": True, "days_before": 0}
                       ]),
    CourtChecklistData(court_code="DHC", petition_type="SLP",
                       effective_date="2024-01-01",
                       rules=SC_CHECKLIST_COMMON),
    CourtChecklistData(court_code="DHC", petition_type="CS",
                       effective_date="2024-01-01",
                       rules=[
                           *DHC_CHECKLIST_COMMON[:4],
                           {"step": 5, "label": "File Written Statement within 30 days", "required": True, "days_before": 0},
                           {"step": 6, "label": "Submit at DHC Civil Section", "required": True, "days_before": 0},
                       ]),
    CourtChecklistData(court_code="DHC", petition_type="WP",
                       effective_date="2024-01-01",
                       rules=DHC_CHECKLIST_COMMON + [
                           {"step": 9, "label": "Submit to DHC Writ Cell", "required": True, "days_before": 0}
                       ]),
    # SC
    CourtChecklistData(court_code="SC", petition_type="SLP",
                       effective_date="2024-01-01",
                       rules=SC_CHECKLIST_COMMON),
    CourtChecklistData(court_code="SC", petition_type="CWP",
                       effective_date="2024-01-01",
                       rules=[
                           *SC_CHECKLIST_COMMON[:4],
                           {"step": 5, "label": "Prepare Art. 32 Petition — Fundamental Rights", "required": True, "days_before": 10},
                           {"step": 6, "label": "Attach violation of FR documents", "required": True, "days_before": 10},
                           {"step": 7, "label": "Submit to SC Main Registry", "required": True, "days_before": 0},
                       ]),
    CourtChecklistData(court_code="SC", petition_type="CS",
                       effective_date="2024-01-01",
                       rules=SC_CHECKLIST_COMMON + [
                           {"step": 10, "label": "Submit Original Civil Suit papers", "required": True, "days_before": 0}
                       ]),
    CourtChecklistData(court_code="SC", petition_type="WP",
                       effective_date="2024-01-01",
                       rules=SC_CHECKLIST_COMMON + [
                           {"step": 10, "label": "Submit to SC PIL Cell", "required": True, "days_before": 0}
                       ]),
]

DEMO_TENANT = DemoTenantData(
    name="Sharma & Associates",
    plan="basic",
    email="demo@sharma-associates.in",
    phone="+919876543210",
    bar_enrolment_no="PB/2020/12345",
    gstin="03AAACH1234P1Z5",
    firm_address="SCO 12, Sector 17-D, Chandigarh 160017",
)

DEMO_USERS: list[DemoUserData] = [
    DemoUserData(
        full_name="Rajesh Sharma",
        email="rajesh@sharma-associates.in",
        phone="+919876543211",
        role="admin",
    ),
    DemoUserData(
        full_name="Priya Mehta",
        email="priya@sharma-associates.in",
        phone="+919876543212",
        role="advocate",
    ),
]

SAMPLE_CASES: list[SampleCaseData] = [
    SampleCaseData(
        case_number="CWP-2474-2024",
        case_title="Priya Mehta vs State of Punjab & Ors.",
        court_code="PHAHC",
        court_display_name="Punjab & Haryana High Court",
        petition_type="CWP",
        client_name="Priya Mehta",
        client_phone="+919876543212",
        client_email="priya.m@example.com",
        status="active",
        urgency_level="high",
        next_hearing_days=7,
    ),
    SampleCaseData(
        case_number="CS-891-2023",
        case_title="Vikram Singh vs HDFC Bank Ltd.",
        court_code="DHC",
        court_display_name="Delhi High Court",
        petition_type="CS",
        client_name="Vikram Singh",
        client_phone="+919988776655",
        client_email="vikram.s@example.com",
        status="active",
        urgency_level="medium",
        next_hearing_days=21,
    ),
    SampleCaseData(
        case_number="SLP-12345-2023",
        case_title="Reliance Industries vs Bharat Petroleum Corp.",
        court_code="SC",
        court_display_name="Supreme Court of India",
        petition_type="SLP",
        client_name="Reliance Industries Ltd.",
        client_phone="+919876500001",
        client_email="legal@reliance.example.com",
        status="active",
        urgency_level="critical",
        next_hearing_days=3,
    ),
]


# ─────────────────────────────────────────────────────────────────────────────
# Async seed functions
# ─────────────────────────────────────────────────────────────────────────────

async def seed_court_checklists(session: AsyncSession) -> list[CourtChecklist]:
    """Insert court checklists for PHAHC, DHC, SC."""
    objects = []
    for data in COURT_CHECKLISTS:
        obj = CourtChecklist(
            checklist_id=uuid.uuid4(),
            court_code=data.court_code,
            petition_type=data.petition_type,
            version="1.0",
            effective_date=datetime.strptime(data.effective_date, "%Y-%m-%d").date(),
            rules=data.rules,
            is_active=True,
        )
        objects.append(obj)
        session.add(obj)
    await session.flush()
    return objects


async def seed_demo_tenant(session: AsyncSession) -> Tenant:
    """Insert the demo tenant."""
    tenant = Tenant(
        tenant_id=uuid.uuid4(),
        name=DEMO_TENANT.name,
        plan=DEMO_TENANT.plan,
        email=DEMO_TENANT.email,
        phone=DEMO_TENANT.phone,
        bar_enrolment_no=DEMO_TENANT.bar_enrolment_no,
        gstin=DEMO_TENANT.gstin,
        firm_address=DEMO_TENANT.firm_address,
        status="active",
        storage_used_bytes=0,
        cases_active_count=len(SAMPLE_CASES),
    )
    session.add(tenant)
    await session.flush()
    return tenant


async def seed_demo_users(session: AsyncSession, tenant: Tenant) -> list[User]:
    """Insert demo admin and advocate users."""
    users = []
    for i, data in enumerate(DEMO_USERS):
        user = User(
            user_id=uuid.uuid4(),
            tenant_id=tenant.tenant_id,
            email=data.email,
            phone=data.phone,
            full_name=data.full_name,
            role=data.role,
            is_active=True,
            notification_prefs={"whatsapp": True, "sms": True, "email": True, "inapp": True},
        )
        users.append(user)
        session.add(user)
    await session.flush()
    return users


async def seed_sample_cases(
    session: AsyncSession,
    tenant: Tenant,
    users: list[User],
) -> list[Case]:
    """Insert 3 sample cases for the demo tenant."""
    advocate = next((u for u in users if u.role == "advocate"), users[0])
    now = datetime.now(timezone.utc)
    cases = []
    for data in SAMPLE_CASES:
        case = Case(
            case_id=uuid.uuid4(),
            tenant_id=tenant.tenant_id,
            assigned_user_id=advocate.user_id,
            case_number=data.case_number,
            case_title=data.case_title,
            court_code=data.court_code,
            court_display_name=data.court_display_name,
            petition_type=data.petition_type,
            client_name=data.client_name,
            client_phone=data.client_phone,
            client_email=data.client_email,
            status=data.status,
            urgency_level=data.urgency_level,
            next_hearing_at=now + timedelta(days=data.next_hearing_days),
            metadata={"seeded": True, "source": "letese_demo_day1"},
            notes=f"Sample case seeded for {data.court_code} — {data.petition_type}",
        )
        cases.append(case)
        session.add(case)
    await session.flush()
    return cases


async def seed_database(session: AsyncSession) -> dict[str, Any]:
    """
    Main entry point — seeds all demo data in order.
    Returns a summary dict for logging.
    """
    tenant = await seed_demo_tenant(session)
    users = await seed_demo_users(session, tenant)
    cases = await seed_sample_cases(session, tenant, users)
    await seed_court_checklists(session)

    await session.commit()

    return {
        "tenant_id": str(tenant.tenant_id),
        "tenant_name": tenant.name,
        "users": [{"user_id": str(u.user_id), "email": u.email, "role": u.role} for u in users],
        "cases": [{"case_id": str(c.case_id), "case_number": c.case_number} for c in cases],
        "checklists_inserted": len(COURT_CHECKLISTS),
    }
