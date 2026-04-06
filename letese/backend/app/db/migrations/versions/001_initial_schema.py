"""001_initial_schema — LETESE● Master Schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Extensions ──────────────────────────────────────────────────────
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "vector"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "btree_gin"')

    # ── Tenants ─────────────────────────────────────────────────────────
    op.create_table(
        "tenants",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), primary_key=True,
                   server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("plan", sa.String(20), nullable=False, server_default="basic"),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("bar_enrolment_no", sa.String(100), nullable=True),
        sa.Column("gstin", sa.String(20), nullable=True),
        sa.Column("firm_address", sa.Text, nullable=True),
        sa.Column("storage_used_bytes", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("cases_active_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("scraper_enabled", sa.Boolean, nullable=False, server_default="FALSE"),
        sa.Column("ai_drafting_enabled", sa.Boolean, nullable=False, server_default="FALSE"),
        sa.Column("translation_enabled", sa.Boolean, nullable=False, server_default="FALSE"),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("razorpay_customer_id", sa.String(100), nullable=True),
        sa.Column("current_period_start", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("current_period_end", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("deleted_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_check_constraint(
        "ck_tenants_plan", "tenants",
        "plan IN ('basic','professional','elite','enterprise')"
    )
    op.create_check_constraint(
        "ck_tenants_status", "tenants",
        "status IN ('active','suspended','trial','cancelled')"
    )

    # ── Users ────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("whatsapp_number", sa.String(20), nullable=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="advocate"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="TRUE"),
        sa.Column("otp_secret", sa.String(100), nullable=True),
        sa.Column("google_sub", sa.String(255), nullable=True),
        sa.Column("last_login_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("notification_prefs", postgresql.JSONB, nullable=False,
                  server_default='{"whatsapp":true,"sms":true,"email":true,"inapp":true}'),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("deleted_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_check_constraint(
        "ck_users_role", "users",
        "role IN ('super_admin','admin','advocate','clerk','paralegal','intern')"
    )

    # ── Cases ────────────────────────────────────────────────────────────
    op.create_table(
        "cases",
        sa.Column("case_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False),
        sa.Column("assigned_user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.user_id"), nullable=True),
        sa.Column("case_number", sa.String(150), nullable=True),
        sa.Column("case_title", sa.String(600), nullable=False),
        sa.Column("court_code", sa.String(50), nullable=False),
        sa.Column("court_display_name", sa.String(255), nullable=True),
        sa.Column("petition_type", sa.String(100), nullable=True),
        sa.Column("client_name", sa.String(255), nullable=False),
        sa.Column("client_phone", sa.String(20), nullable=False),
        sa.Column("client_email", sa.String(255), nullable=True),
        sa.Column("client_whatsapp", sa.String(20), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="active"),
        sa.Column("urgency_level", sa.String(10), nullable=False, server_default="low"),
        sa.Column("next_hearing_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("last_order_text", sa.Text, nullable=True),
        sa.Column("last_order_date", sa.Date, nullable=True),
        sa.Column("last_order_summary", sa.Text, nullable=True),
        sa.Column("last_scraped_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("scrape_error_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("court_url", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("deleted_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_check_constraint(
        "ck_cases_status", "cases",
        "status IN ('active','closed','stayed','transferred','archived')"
    )
    op.create_check_constraint(
        "ck_cases_urgency", "cases",
        "urgency_level IN ('critical','high','medium','low')"
    )
    op.create_index("idx_cases_tenant_status", "cases", ["tenant_id", "status"],
                    postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index("idx_cases_hearing_date", "cases", ["next_hearing_at"],
                    postgresql_where=sa.text("status = 'active'"))
    op.create_index(
        "idx_cases_title_fts", "cases", [],
        postgresql_using="gin",
        postgresql_ops={},
        # GIN index on to_tsvector — expressed via postgresql_create_index_string below
    )
    # FTS indexes as raw SQL (Alembic doesn't support func() in index def easily)
    op.execute("CREATE INDEX idx_cases_title_fts ON cases USING gin(to_tsvector('english', case_title))")
    op.execute("CREATE INDEX idx_cases_client_fts ON cases USING gin(to_tsvector('english', client_name))")

    # ── Case Hearings ─────────────────────────────────────────────────────
    op.create_table(
        "case_hearings",
        sa.Column("hearing_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("case_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("hearing_date", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("court_code", sa.String(50), nullable=True),
        sa.Column("bench", sa.String(255), nullable=True),
        sa.Column("purpose", sa.String(255), nullable=True),
        sa.Column("outcome", sa.Text, nullable=True),
        sa.Column("next_date", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("source", sa.String(20), nullable=False, server_default="scraper"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
    )
    op.create_index("idx_hearings_case", "case_hearings", ["case_id", "hearing_date"])

    # ── Communication Schedule ────────────────────────────────────────────
    op.create_table(
        "communication_schedule",
        sa.Column("schedule_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("case_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message_type", sa.String(30), nullable=False),
        sa.Column("scheduled_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("sent", sa.Boolean, nullable=False, server_default="FALSE"),
        sa.Column("sent_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("channel", sa.String(20), nullable=False, server_default="whatsapp"),
        sa.Column("template_params", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
    )
    op.create_check_constraint(
        "ck_comm_schedule_msg_type", "communication_schedule",
        "message_type IN ('reminder_15d','reminder_7d','reminder_48h','reminder_24h',"
        "'order_alert','payment_reminder','document_chase')"
    )
    op.create_check_constraint(
        "ck_comm_schedule_channel", "communication_schedule",
        "channel IN ('whatsapp','sms','email','ai_call')"
    )
    op.create_index("idx_comm_schedule_due", "communication_schedule",
                    ["scheduled_at", "sent"],
                    postgresql_where=sa.text("sent = FALSE"))

    # ── Communication Log ────────────────────────────────────────────────
    op.create_table(
        "communication_log",
        sa.Column("log_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("case_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("message_type", sa.String(30), nullable=False),
        sa.Column("recipient_phone", sa.String(20), nullable=True),
        sa.Column("recipient_email", sa.String(255), nullable=True),
        sa.Column("message_body", sa.Text, nullable=False),
        sa.Column("template_name", sa.String(100), nullable=True),
        sa.Column("delivery_status", sa.String(20), nullable=False, server_default="sent"),
        sa.Column("provider_message_id", sa.String(255), nullable=True),
        sa.Column("dispatched_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("delivered_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("read_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("error_code", sa.String(50), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("llm_tokens_used", sa.Integer, server_default="0"),
        sa.Column("llm_cost_inr", sa.Numeric(8, 4), server_default="0"),
    )
    op.create_index("idx_comm_log_case", "communication_log", ["case_id", "dispatched_at"])
    op.create_index("idx_comm_log_phone", "communication_log", ["recipient_phone", "dispatched_at"])
    op.create_index("idx_comm_log_failed", "communication_log", ["delivery_status"],
                    postgresql_where=sa.text("delivery_status = 'failed'"))

    # ── Documents ─────────────────────────────────────────────────────────
    op.create_table(
        "documents",
        sa.Column("doc_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("case_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("cases.case_id", ondelete="SET NULL"), nullable=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.user_id"), nullable=True),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("doc_type", sa.String(50), nullable=False),
        sa.Column("file_format", sa.String(10), nullable=False),
        sa.Column("s3_bucket", sa.String(255), nullable=False),
        sa.Column("s3_key", sa.String(500), nullable=False),
        sa.Column("s3_url", sa.Text, nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger, nullable=False),
        sa.Column("language", sa.String(20), nullable=False, server_default="en"),
        sa.Column("translation_of", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("documents.doc_id"), nullable=True),
        sa.Column("accuracy_pct", sa.Numeric(5, 2), nullable=True),
        sa.Column("is_filing_ready", sa.Boolean, nullable=False, server_default="FALSE"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("deleted_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("idx_documents_case", "documents", ["case_id"])

    # ── YJS Document State ───────────────────────────────────────────────
    op.create_table(
        "yjs_documents",
        sa.Column("ydoc_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("doc_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("documents.doc_id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ydoc_state", sa.LargeBinary(), nullable=False),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("last_editor_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.user_id"), nullable=True),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
    )

    # ── Tasks ─────────────────────────────────────────────────────────────
    op.create_table(
        "tasks",
        sa.Column("task_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=True),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.user_id"), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("due_date", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("priority", sa.String(10), nullable=False, server_default="medium"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("source", sa.String(20), nullable=False, server_default="manual"),
        sa.Column("source_order_text", sa.Text, nullable=True),
        sa.Column("completed_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
    )
    op.create_index("idx_tasks_due", "tasks", ["tenant_id", "due_date", "status"],
                    postgresql_where=sa.text("status != 'completed'"))

    # ── Invoices ─────────────────────────────────────────────────────────
    op.create_table(
        "invoices",
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.tenant_id"), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("cases.case_id"), nullable=True),
        sa.Column("client_name", sa.String(255), nullable=False),
        sa.Column("client_gstin", sa.String(20), nullable=True),
        sa.Column("invoice_number", sa.String(50), nullable=False, unique=True),
        sa.Column("issue_date", sa.Date, nullable=False, server_default=sa.text("CURRENT_DATE")),
        sa.Column("due_date", sa.Date, nullable=False),
        sa.Column("subtotal_inr", sa.Numeric(10, 2), nullable=False),
        sa.Column("gst_pct", sa.Numeric(4, 2), nullable=False, server_default="18.00"),
        sa.Column("gst_inr", sa.Numeric(10, 2), nullable=False),
        sa.Column("total_inr", sa.Numeric(10, 2), nullable=False),
        sa.Column("paid_inr", sa.Numeric(10, 2), server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("payment_link", sa.Text, nullable=True),
        sa.Column("razorpay_order_id", sa.String(100), nullable=True),
        sa.Column("s3_pdf_key", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
    )

    # ── Audit Logs ────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("audit_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("audit_type", sa.String(20), nullable=False),
        sa.Column("started_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("completed_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("duration_ms", sa.Integer, nullable=True),
        sa.Column("checks_run", sa.Integer, nullable=False, server_default="0"),
        sa.Column("checks_passed", sa.Integer, nullable=False, server_default="0"),
        sa.Column("checks_failed", sa.Integer, nullable=False, server_default="0"),
        sa.Column("auto_actions_taken", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("escalation_triggered", sa.Boolean, nullable=False, server_default="FALSE"),
        sa.Column("pagerduty_incident_id", sa.String(100), nullable=True),
        sa.Column("full_report", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
    )
    op.create_index("idx_audit_type_date", "audit_logs", ["audit_type", "started_at"])

    # ── Court Checklists ───────────────────────────────────────────────────
    op.create_table(
        "court_checklists",
        sa.Column("checklist_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("court_code", sa.String(50), nullable=False),
        sa.Column("petition_type", sa.String(100), nullable=False),
        sa.Column("version", sa.String(20), nullable=False, server_default="1.0"),
        sa.Column("effective_date", sa.Date, nullable=False),
        sa.Column("rules", postgresql.JSONB, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="TRUE"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
    )
    op.create_index(
        "idx_checklist_active", "court_checklists",
        ["court_code", "petition_type", "is_active"], unique=True,
        postgresql_where=sa.text("is_active = TRUE")
    )

    # ── Case Embeddings (pgvector) ────────────────────────────────────────
    op.create_table(
        "case_embeddings",
        sa.Column("embedding_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_type", sa.String(30), nullable=False),
        sa.Column("case_citation", sa.String(400), nullable=False),
        sa.Column("court_code", sa.String(50), nullable=False),
        sa.Column("judgment_year", sa.Integer, nullable=False),
        sa.Column("bench", sa.String(255), nullable=True),
        sa.Column("summary_text", sa.Text, nullable=False),
        sa.Column("full_text_url", sa.Text, nullable=True),
        sa.Column("embedding_vector", postgresql.VECTOR(768), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
    )
    op.execute(
        "CREATE INDEX idx_embeddings_hnsw ON case_embeddings "
        "USING hnsw (embedding_vector vector_cosine_ops) WITH (m = 16, ef_construction = 64)"
    )
    op.create_index("idx_embeddings_court", "case_embeddings", ["court_code", "judgment_year"])

    # ── Vendor Configs ─────────────────────────────────────────────────────
    op.create_table(
        "vendor_configs",
        sa.Column("config_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("vendor_name", sa.String(100), nullable=False, unique=True),
        sa.Column("config_data", postgresql.JSONB, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="TRUE"),
        sa.Column("last_verified_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("verification_status", sa.String(20), server_default="unverified"),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.user_id"), nullable=True),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
    )

    # ── LLM Usage Log ──────────────────────────────────────────────────────
    op.create_table(
        "llm_usage_log",
        sa.Column("usage_id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tenants.tenant_id"), nullable=True),
        sa.Column("provider", sa.String(30), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("task_type", sa.String(50), nullable=False),
        sa.Column("tokens_input", sa.Integer, nullable=False),
        sa.Column("tokens_output", sa.Integer, nullable=False),
        sa.Column("cost_inr", sa.Numeric(8, 4), nullable=False, server_default="0"),
        sa.Column("latency_ms", sa.Integer, nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
    )
    op.create_index(
        "idx_llm_usage_tenant", "llm_usage_log", ["tenant_id", "created_at"],
        postgresql_where=sa.text("created_at > NOW() - INTERVAL '31 days'")
    )

    # ── Row-Level Security ─────────────────────────────────────────────────
    # RLS policies (requires SET LOCAL so we apply them after table creation)
    op.execute("ALTER TABLE cases ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE documents ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE tasks ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE invoices ENABLE ROW LEVEL SECURITY")

    op.execute("""
        CREATE POLICY tenant_iso_cases ON cases
            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID)
    """)
    op.execute("""
        CREATE POLICY tenant_iso_docs ON documents
            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID)
    """)
    op.execute("""
        CREATE POLICY tenant_iso_comm ON communication_log
            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID)
    """)
    op.execute("""
        CREATE POLICY tenant_iso_tasks ON tasks
            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID)
    """)
    op.execute("""
        CREATE POLICY tenant_iso_invoices ON invoices
            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID)
    """)
    op.execute("""
        CREATE POLICY super_admin_bypass ON cases
            USING (current_setting('app.role', true) = 'super_admin')
    """)

    # ── Auto-updated_at Trigger ─────────────────────────────────────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
        $$ LANGUAGE plpgsql
    """)
    for table in ["tenants", "users", "cases", "documents", "invoices", "tasks"]:
        op.execute(f"""
            CREATE TRIGGER trg_updated_at_{table}
            BEFORE UPDATE ON {table}
            FOR EACH ROW EXECUTE FUNCTION update_updated_at()
        """)


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_table("llm_usage_log")
    op.drop_table("vendor_configs")
    op.drop_table("case_embeddings")
    op.drop_table("court_checklists")
    op.drop_table("audit_logs")
    op.drop_table("invoices")
    op.drop_table("tasks")
    op.drop_table("yjs_documents")
    op.drop_table("documents")
    op.drop_table("communication_log")
    op.drop_table("communication_schedule")
    op.drop_table("case_hearings")
    op.drop_table("cases")
    op.drop_table("users")
    op.drop_table("tenants")
    # Extensions intentionally not dropped on downgrade
