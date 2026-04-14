"""
LETESE● SQLAlchemy Models
Maps PostgreSQL schema to Python objects.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, BigInteger, Text, Date, DateTime, ForeignKey, Numeric, Index, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    tenant_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = Column(String(255), nullable=False)
    plan: Mapped[str] = Column(String(20), nullable=False, default="basic")
    email: Mapped[str] = Column(String(255), nullable=False, unique=True)
    phone: Mapped[str] = Column(String(20), nullable=False)
    bar_enrolment_no: Mapped[str | None] = Column(String(100))
    gstin: Mapped[str | None] = Column(String(20))
    firm_address: Mapped[str | None] = Column(Text)
    storage_used_bytes: Mapped[int] = Column(BigInteger, default=0)
    cases_active_count: Mapped[int] = Column(Integer, default=0)
    scraper_enabled: Mapped[bool] = Column(Boolean, default=False)
    ai_drafting_enabled: Mapped[bool] = Column(Boolean, default=False)
    translation_enabled: Mapped[bool] = Column(Boolean, default=False)
    status: Mapped[str] = Column(String(20), default="active")
    razorpay_customer_id: Mapped[str | None] = Column(String(100))
    current_period_start: Mapped[datetime | None] = Column(DateTime(timezone=True))
    current_period_end: Mapped[datetime | None] = Column(DateTime(timezone=True))
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = Column(DateTime(timezone=True))

    users: Mapped[list["User"]] = relationship("User", back_populates="tenant")
    cases: Mapped[list["Case"]] = relationship("Case", back_populates="tenant")


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = Column(String(255), nullable=False, unique=True)
    phone: Mapped[str | None] = Column(String(20))
    whatsapp_number: Mapped[str | None] = Column(String(20))
    full_name: Mapped[str] = Column(String(255), nullable=False)
    role: Mapped[str] = Column(String(20), nullable=False, default="advocate")
    is_active: Mapped[bool] = Column(Boolean, default=True)
    otp_secret: Mapped[str | None] = Column(String(100))
    google_sub: Mapped[str | None] = Column(String(255))
    last_login_at: Mapped[datetime | None] = Column(DateTime(timezone=True))
    notification_prefs: Mapped[dict] = Column(JSONB, default=lambda: {"whatsapp": True, "sms": True, "email": True, "inapp": True})
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = Column(DateTime(timezone=True))

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="users")

    __table_args__ = (
        CheckConstraint(
            role.in_(["super_admin", "admin", "advocate", "clerk", "paralegal", "intern"]),
            name="ck_users_role",
        ),
    )


class Case(Base):
    __tablename__ = "cases"

    case_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    assigned_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    case_number: Mapped[str | None] = Column(String(150))
    case_title: Mapped[str] = Column(String(600), nullable=False)
    court_code: Mapped[str] = Column(String(50), nullable=False)
    court_display_name: Mapped[str | None] = Column(String(255))
    petition_type: Mapped[str | None] = Column(String(100))
    client_name: Mapped[str] = Column(String(255), nullable=False)
    client_phone: Mapped[str] = Column(String(20), nullable=False)
    client_email: Mapped[str | None] = Column(String(255))
    client_whatsapp: Mapped[str | None] = Column(String(20))
    status: Mapped[str] = Column(String(30), default="active")
    urgency_level: Mapped[str] = Column(String(10), default="low")
    next_hearing_at: Mapped[datetime | None] = Column(DateTime(timezone=True))
    last_order_text: Mapped[str | None] = Column(Text)
    last_order_date: Mapped[datetime | None] = Column(Date)
    last_order_summary: Mapped[str | None] = Column(Text)
    last_scraped_at: Mapped[datetime | None] = Column(DateTime(timezone=True))
    scrape_error_count: Mapped[int] = Column(Integer, default=0)
    court_url: Mapped[str | None] = Column(Text)
    notes: Mapped[str | None] = Column(Text)
    case_metadata: Mapped[dict] = Column(JSONB, default=dict)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = Column(DateTime(timezone=True))

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="cases")

    __table_args__ = (
        Index("idx_cases_tenant_status", "tenant_id", "status", postgresql_where=text("deleted_at IS NULL")),
        Index("idx_cases_hearing_date", "next_hearing_at", postgresql_where=text("status = 'active'")),
    )


class CaseHearing(Base):
    __tablename__ = "case_hearings"

    hearing_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)
    hearing_date = Column(DateTime(timezone=True), nullable=False)
    court_code: Mapped[str | None] = Column(String(50))
    bench: Mapped[str | None] = Column(String(255))
    purpose: Mapped[str | None] = Column(String(255))
    outcome: Mapped[str | None] = Column(Text)
    next_date: Mapped[datetime | None] = Column(DateTime(timezone=True))
    source: Mapped[str] = Column(String(20), default="scraper")
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_hearings_case", "case_id", "hearing_date"),
    )


class CommunicationLog(Base):
    __tablename__ = "communication_log"

    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)
    channel = Column(String(20), nullable=False)
    message_type = Column(String(30), nullable=False)
    recipient_phone: Mapped[str | None] = Column(String(20))
    recipient_email: Mapped[str | None] = Column(String(255))
    message_body = Column(Text, nullable=False)
    template_name: Mapped[str | None] = Column(String(100))
    delivery_status = Column(String(20), default="sent")
    provider_message_id: Mapped[str | None] = Column(String(255))
    dispatched_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at: Mapped[datetime | None] = Column(DateTime(timezone=True))
    read_at: Mapped[datetime | None] = Column(DateTime(timezone=True))
    error_code: Mapped[str | None] = Column(String(50))
    error_message: Mapped[str | None] = Column(Text)
    llm_tokens_used: Mapped[int] = Column(Integer, default=0)
    llm_cost_inr: Mapped[float] = Column(Numeric(8, 4), default=0)


class Document(Base):
    __tablename__ = "documents"

    doc_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.case_id", ondelete="SET NULL"))
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    name = Column(String(500), nullable=False)
    doc_type = Column(String(50), nullable=False)
    file_format = Column(String(10), nullable=False)
    s3_bucket = Column(String(255), nullable=False)
    s3_key = Column(String(500), nullable=False)
    s3_url: Mapped[str | None] = Column(Text)
    file_size_bytes = Column(BigInteger, nullable=False)
    language = Column(String(20), default="en")
    translation_of = Column(UUID(as_uuid=True), ForeignKey("documents.doc_id"))
    accuracy_pct: Mapped[float | None] = Column(Numeric(5, 2))
    is_filing_ready: Mapped[bool] = Column(Boolean, default=False)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = Column(DateTime(timezone=True))


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.case_id", ondelete="CASCADE"))
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    title = Column(String(500), nullable=False)
    description: Mapped[str | None] = Column(Text)
    due_date = Column(DateTime(timezone=True), nullable=False)
    priority = Column(String(10), default="medium")
    status = Column(String(20), default="pending")
    source = Column(String(20), default="manual")
    source_order_text: Mapped[str | None] = Column(Text)
    completed_at: Mapped[datetime | None] = Column(DateTime(timezone=True))
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_tasks_due", "tenant_id", "due_date", "status", postgresql_where=text("status != 'completed'")),
    )


class Invoice(Base):
    __tablename__ = "invoices"

    invoice_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.case_id"))
    client_name = Column(String(255), nullable=False)
    client_gstin: Mapped[str | None] = Column(String(20))
    invoice_number = Column(String(50), nullable=False, unique=True)
    issue_date = Column(Date, default=func.current_date())
    due_date = Column(Date, nullable=False)
    subtotal_inr = Column(Numeric(10, 2), nullable=False)
    gst_pct = Column(Numeric(4, 2), default=18.0)
    gst_inr = Column(Numeric(10, 2), nullable=False)
    total_inr = Column(Numeric(10, 2), nullable=False)
    paid_inr = Column(Numeric(10, 2), default=0)
    status = Column(String(20), default="pending")
    payment_link: Mapped[str | None] = Column(Text)
    razorpay_order_id: Mapped[str | None] = Column(String(100))
    s3_pdf_key: Mapped[str | None] = Column(Text)
    notes: Mapped[str | None] = Column(Text)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_type = Column(String(20), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = Column(DateTime(timezone=True))
    duration_ms: Mapped[int | None] = Column(Integer)
    checks_run = Column(Integer, default=0)
    checks_passed = Column(Integer, default=0)
    checks_failed = Column(Integer, default=0)
    auto_actions_taken = Column(JSONB, default=list)
    escalation_triggered = Column(Boolean, default=False)
    pagerduty_incident_id: Mapped[str | None] = Column(String(100))
    full_report = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_audit_type_date", "audit_type", "started_at"),
    )


class CourtChecklist(Base):
    __tablename__ = "court_checklists"

    checklist_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    court_code = Column(String(50), nullable=False)
    petition_type = Column(String(100), nullable=False)
    version = Column(String(20), default="1.0")
    effective_date = Column(Date, nullable=False)
    rules = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_checklist_active", "court_code", "petition_type", "is_active", unique=True,
              postgresql_where=text("is_active = TRUE")),
    )


class VendorConfig(Base):
    __tablename__ = "vendor_configs"

    config_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_name = Column(String(100), nullable=False, unique=True)
    config_data = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True)
    last_verified_at: Mapped[datetime | None] = Column(DateTime(timezone=True))
    verification_status = Column(String(20), default="unverified")
    updated_by: Mapped[uuid.UUID | None] = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class LLMUsageLog(Base):
    __tablename__ = "llm_usage_log"

    usage_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"))
    provider = Column(String(30), nullable=False)
    model = Column(String(100), nullable=False)
    task_type = Column(String(50), nullable=False)
    tokens_input = Column(Integer, nullable=False)
    tokens_output = Column(Integer, nullable=False)
    cost_inr = Column(Numeric(8, 4), default=0)
    latency_ms: Mapped[int | None] = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_llm_usage_tenant", "tenant_id", "created_at"),
    )


class CommunicationSchedule(Base):
    __tablename__ = "communication_schedules"

    schedule_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.case_id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    message_type = Column(String(50), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    channel = Column(String(20), nullable=False, default="whatsapp")
    template_params = Column(JSONB, default=dict)
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_comm_schedule_tenant", "tenant_id"),
        Index("idx_comm_schedule_case", "case_id"),
        Index("idx_comm_schedule_pending", "scheduled_at", postgresql_where=text("sent = FALSE AND deleted_at IS NULL")),
    )


# ── WALLET MODELS ────────────────────────────────────────────────────────────

class Wallet(Base):
    __tablename__ = "wallets"

    wallet_id        = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id        = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), unique=True, nullable=False)
    balance_inr      = Column(Numeric(12, 2), nullable=False, default=0.00)
    total_loaded_inr = Column(Numeric(12, 2), nullable=False, default=0.00)
    created_at       = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class WalletTopupRequest(Base):
    __tablename__ = "wallet_topup_requests"

    request_id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id           = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    requested_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    amount_inr          = Column(Numeric(12, 2), nullable=False)
    payment_method      = Column(String(30), nullable=False)
    transaction_ref     = Column(String(200))
    remarks             = Column(Text)
    status              = Column(String(20), nullable=False, default="pending")
    admin_notes         = Column(Text)
    approved_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    approved_at         = Column(DateTime(timezone=True))
    created_at          = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    transaction_id      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id           = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False)
    amount_inr          = Column(Numeric(12, 2), nullable=False)
    type                = Column(String(20), nullable=False)  # credit | debit
    source              = Column(String(30), nullable=False)  # topup | purchase | refund | correction | ai_draft | whatsapp | storage
    reference_id        = Column(UUID(as_uuid=True))
    reference_type      = Column(String(50))
    description         = Column(Text)
    balance_before_inr = Column(Numeric(12, 2), nullable=False)
    balance_after_inr  = Column(Numeric(12, 2), nullable=False)
    created_at          = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
