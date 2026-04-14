-- ================================================================
-- LETESE● MASTER SCHEMA — PostgreSQL 16 + pgvector
-- MODULE A: Database Schema & Migrations
-- Run: psql -U postgres -d letese_prod -f schema.sql
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ── TENANTS ──────────────────────────────────────────────────────
CREATE TABLE tenants (
    tenant_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    plan            VARCHAR(20) NOT NULL DEFAULT 'basic'
                        CHECK (plan IN ('basic','professional','elite','enterprise')),
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20) NOT NULL,
    bar_enrolment_no VARCHAR(100),
    gstin           VARCHAR(20),
    firm_address    TEXT,
    storage_used_bytes BIGINT NOT NULL DEFAULT 0,
    cases_active_count INTEGER NOT NULL DEFAULT 0,
    scraper_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ai_drafting_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    translation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','suspended','trial','cancelled')),
    razorpay_customer_id VARCHAR(100),
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ── USERS ────────────────────────────────────────────────────────
CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    whatsapp_number VARCHAR(20),
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'advocate'
                        CHECK (role IN ('super_admin','admin','advocate','clerk','paralegal','intern')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    otp_secret      VARCHAR(100),
    google_sub      VARCHAR(255),
    last_login_at   TIMESTAMPTZ,
    notification_prefs JSONB NOT NULL DEFAULT
                        '{"whatsapp":true,"sms":true,"email":true,"inapp":true}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ── CASES ────────────────────────────────────────────────────────
CREATE TABLE cases (
    case_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    assigned_user_id    UUID REFERENCES users(user_id),
    case_number         VARCHAR(150),
    case_title          VARCHAR(600) NOT NULL,
    court_code          VARCHAR(50) NOT NULL,
    court_display_name  VARCHAR(255),
    petition_type       VARCHAR(100),
    client_name         VARCHAR(255) NOT NULL,
    client_phone        VARCHAR(20) NOT NULL,
    client_email        VARCHAR(255),
    client_whatsapp     VARCHAR(20),
    status              VARCHAR(30) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','closed','stayed','transferred','archived')),
    urgency_level       VARCHAR(10) NOT NULL DEFAULT 'low'
                        CHECK (urgency_level IN ('critical','high','medium','low')),
    next_hearing_at     TIMESTAMPTZ,
    last_order_text     TEXT,
    last_order_date     DATE,
    last_order_summary  TEXT,
    last_scraped_at     TIMESTAMPTZ,
    scrape_error_count  INTEGER NOT NULL DEFAULT 0,
    court_url           TEXT,
    notes               TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_cases_tenant_status ON cases(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_hearing_date ON cases(next_hearing_at) WHERE status = 'active';
CREATE INDEX idx_cases_title_fts ON cases USING gin(to_tsvector('english', case_title));
CREATE INDEX idx_cases_client_fts ON cases USING gin(to_tsvector('english', client_name));

-- ── CASE HEARINGS ────────────────────────────────────────────────
CREATE TABLE case_hearings (
    hearing_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL,
    hearing_date    TIMESTAMPTZ NOT NULL,
    court_code      VARCHAR(50),
    bench           VARCHAR(255),
    purpose         VARCHAR(255),
    outcome         TEXT,
    next_date       TIMESTAMPTZ,
    source          VARCHAR(20) NOT NULL DEFAULT 'scraper'
                        CHECK (source IN ('scraper','manual','advocate')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_hearings_case ON case_hearings(case_id, hearing_date DESC);

-- ── COMMUNICATION SCHEDULE ────────────────────────────────────────
CREATE TABLE communication_schedule (
    schedule_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL,
    message_type    VARCHAR(30) NOT NULL
                        CHECK (message_type IN (
                            'reminder_15d','reminder_7d','reminder_48h','reminder_24h',
                            'order_alert','payment_reminder','document_chase')),
    scheduled_at    TIMESTAMPTZ NOT NULL,
    sent            BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMPTZ,
    channel         VARCHAR(20) NOT NULL DEFAULT 'whatsapp'
                        CHECK (channel IN ('whatsapp','sms','email','ai_call')),
    template_params JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comm_schedule_due ON communication_schedule(scheduled_at, sent) WHERE sent = FALSE;

-- ── COMMUNICATION LOG ─────────────────────────────────────────────
CREATE TABLE communication_log (
    log_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    tenant_id           UUID NOT NULL,
    channel             VARCHAR(20) NOT NULL,
    message_type        VARCHAR(30) NOT NULL,
    recipient_phone     VARCHAR(20),
    recipient_email     VARCHAR(255),
    message_body        TEXT NOT NULL,
    template_name       VARCHAR(100),
    delivery_status     VARCHAR(20) NOT NULL DEFAULT 'sent'
                        CHECK (delivery_status IN ('sent','delivered','read','failed','bounced')),
    provider_message_id VARCHAR(255),
    dispatched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at        TIMESTAMPTZ,
    read_at             TIMESTAMPTZ,
    error_code          VARCHAR(50),
    error_message       TEXT,
    llm_tokens_used     INTEGER DEFAULT 0,
    llm_cost_inr        DECIMAL(8,4) DEFAULT 0
);
CREATE INDEX idx_comm_log_case ON communication_log(case_id, dispatched_at DESC);
CREATE INDEX idx_comm_log_phone ON communication_log(recipient_phone, dispatched_at DESC);
CREATE INDEX idx_comm_log_failed ON communication_log(delivery_status) WHERE delivery_status = 'failed';

-- ── DOCUMENTS ─────────────────────────────────────────────────────
CREATE TABLE documents (
    doc_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id              UUID REFERENCES cases(case_id) ON DELETE SET NULL,
    tenant_id            UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    uploaded_by          UUID REFERENCES users(user_id),
    name                 VARCHAR(500) NOT NULL,
    doc_type             VARCHAR(50) NOT NULL
                            CHECK (doc_type IN ('petition','affidavit','order','vakalatnama',
                                                'evidence','translated','ai_draft','other')),
    file_format          VARCHAR(10) NOT NULL CHECK (file_format IN ('pdf','docx','jpg','png','mp3')),
    s3_bucket            VARCHAR(255) NOT NULL,
    s3_key               VARCHAR(500) NOT NULL,
    s3_url               TEXT,
    file_size_bytes      BIGINT NOT NULL,
    language             VARCHAR(20) NOT NULL DEFAULT 'en'
                            CHECK (language IN ('en','hi','pa','ta','te','kn','mr','gu')),
    translation_of       UUID REFERENCES documents(doc_id),
    accuracy_pct         DECIMAL(5,2),
    is_filing_ready      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at           TIMESTAMPTZ
);

-- ── Y.JS DOCUMENT STATE ──────────────────────────────────────────
CREATE TABLE yjs_documents (
    ydoc_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id         UUID NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    tenant_id      UUID NOT NULL,
    ydoc_state     BYTEA NOT NULL,
    version        INTEGER NOT NULL DEFAULT 1,
    last_editor_id UUID REFERENCES users(user_id),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TASKS ────────────────────────────────────────────────────────
CREATE TABLE tasks (
    task_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    case_id           UUID REFERENCES cases(case_id) ON DELETE CASCADE,
    assigned_to       UUID REFERENCES users(user_id),
    title             VARCHAR(500) NOT NULL,
    description       TEXT,
    due_date          TIMESTAMPTZ NOT NULL,
    priority          VARCHAR(10) NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('critical','high','medium','low')),
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','completed','cancelled')),
    source            VARCHAR(20) NOT NULL DEFAULT 'manual'
                        CHECK (source IN ('manual','court_order','ai_extracted','communication')),
    source_order_text TEXT,
    completed_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tasks_due ON tasks(tenant_id, due_date, status) WHERE status != 'completed';

-- ── INVOICES ─────────────────────────────────────────────────────
CREATE TABLE invoices (
    invoice_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(tenant_id),
    case_id           UUID REFERENCES cases(case_id),
    client_name       VARCHAR(255) NOT NULL,
    client_gstin      VARCHAR(20),
    invoice_number    VARCHAR(50) NOT NULL UNIQUE,
    issue_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date          DATE NOT NULL,
    subtotal_inr      DECIMAL(10,2) NOT NULL,
    gst_pct           DECIMAL(4,2) NOT NULL DEFAULT 18.00,
    gst_inr           DECIMAL(10,2) NOT NULL,
    total_inr         DECIMAL(10,2) NOT NULL,
    paid_inr          DECIMAL(10,2) NOT NULL DEFAULT 0,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('draft','sent','partial','paid','overdue','cancelled')),
    payment_link      TEXT,
    razorpay_order_id VARCHAR(100),
    s3_pdf_key        TEXT,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AUDIT LOGS ───────────────────────────────────────────────────
CREATE TABLE audit_logs (
    audit_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_type         VARCHAR(20) NOT NULL CHECK (audit_type IN ('small','major','compliance')),
    started_at         TIMESTAMPTZ NOT NULL,
    completed_at       TIMESTAMPTZ,
    duration_ms        INTEGER,
    checks_run         INTEGER NOT NULL DEFAULT 0,
    checks_passed      INTEGER NOT NULL DEFAULT 0,
    checks_failed      INTEGER NOT NULL DEFAULT 0,
    auto_actions_taken JSONB NOT NULL DEFAULT '[]',
    escalation_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    pagerduty_incident_id VARCHAR(100),
    full_report        JSONB NOT NULL DEFAULT '{}',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_type_date ON audit_logs(audit_type, started_at DESC);

-- ── COURT CHECKLISTS ─────────────────────────────────────────────
CREATE TABLE court_checklists (
    checklist_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_code      VARCHAR(50) NOT NULL,
    petition_type   VARCHAR(100) NOT NULL,
    version         VARCHAR(20) NOT NULL DEFAULT '1.0',
    effective_date DATE NOT NULL,
    rules           JSONB NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_checklist_active ON court_checklists(court_code, petition_type, is_active)
    WHERE is_active = TRUE;

-- ── CASE EMBEDDINGS (pgvector) ───────────────────────────────────
CREATE TABLE case_embeddings (
    embedding_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type      VARCHAR(30) NOT NULL
                        CHECK (source_type IN ('sc_judgment','hc_judgment','order')),
    case_citation   VARCHAR(400) NOT NULL,
    court_code       VARCHAR(50) NOT NULL,
    judgment_year    INTEGER NOT NULL,
    bench            VARCHAR(255),
    summary_text     TEXT NOT NULL,
    full_text_url   TEXT,
    embedding_vector vector(768),
    metadata         JSONB NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_embeddings_hnsw ON case_embeddings
    USING hnsw (embedding_vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_embeddings_court ON case_embeddings(court_code, judgment_year);

-- ── VENDOR CONFIGS ───────────────────────────────────────────────
CREATE TABLE vendor_configs (
    config_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name         VARCHAR(100) NOT NULL UNIQUE,
    config_data         JSONB NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_verified_at    TIMESTAMPTZ,
    verification_status VARCHAR(20) DEFAULT 'unverified'
                            CHECK (verification_status IN ('verified','failed','unverified')),
    updated_by          UUID REFERENCES users(user_id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LLM USAGE LOG ────────────────────────────────────────────────
CREATE TABLE llm_usage_log (
    usage_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID REFERENCES tenants(tenant_id),
    provider       VARCHAR(30) NOT NULL,
    model          VARCHAR(100) NOT NULL,
    task_type      VARCHAR(50) NOT NULL,
    tokens_input   INTEGER NOT NULL,
    tokens_output  INTEGER NOT NULL,
    cost_inr       DECIMAL(8,4) NOT NULL DEFAULT 0,
    latency_ms     INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_llm_usage_tenant ON llm_usage_log(tenant_id, created_at)
    WHERE created_at > NOW() - INTERVAL '31 days';

-- ── ROW-LEVEL SECURITY ───────────────────────────────────────────
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- App sets: SET LOCAL app.current_tenant_id = '{uuid}' before every query
CREATE POLICY tenant_iso_cases ON cases
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_iso_docs ON documents
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_iso_comm ON communication_log
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_iso_tasks ON tasks
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_iso_invoices ON invoices
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Super admin bypass
CREATE POLICY super_admin_bypass ON cases
    USING (current_setting('app.role', true) = 'super_admin');

-- ── AUTO updated_at TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['tenants','users','cases','documents','invoices','tasks'] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
    END LOOP;
END $$;

-- ── WALLETS ─────────────────────────────────────────────────────
CREATE TABLE wallets (
    wallet_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL UNIQUE REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    balance_inr     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_loaded_inr DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_topup_requests (
    request_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    requested_by_user_id UUID NOT NULL REFERENCES users(user_id),
    amount_inr          DECIMAL(12,2) NOT NULL CHECK (amount_inr > 0),
    payment_method      VARCHAR(30) NOT NULL
        CHECK (payment_method IN ('cash','upi','bank_transfer','cheque','other')),
    transaction_ref     VARCHAR(200),
    remarks             TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected','cancelled')),
    admin_notes         TEXT,
    approved_by_user_id UUID REFERENCES users(user_id),
    approved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
    transaction_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    amount_inr         DECIMAL(12,2) NOT NULL,
    type               VARCHAR(20) NOT NULL
        CHECK (type IN ('credit','debit')),
    source             VARCHAR(30) NOT NULL
        CHECK (source IN ('topup','purchase','refund','correction','ai_draft','whatsapp','storage')),
    reference_id       UUID,
    reference_type     VARCHAR(50),
    description        TEXT,
    balance_before_inr DECIMAL(12,2) NOT NULL,
    balance_after_inr  DECIMAL(12,2) NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_topup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_iso_wallets ON wallets
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_iso_topup_req ON wallet_topup_requests
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_iso_wallet_txn ON wallet_transactions
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY super_admin_rw_wallets ON wallets
    USING (current_setting('app.role', true) = 'super_admin')
    WITH CHECK (current_setting('app.role', true) = 'super_admin');
CREATE POLICY super_admin_rw_topup_req ON wallet_topup_requests
    USING (current_setting('app.role', true) = 'super_admin')
    WITH CHECK (current_setting('app.role', true) = 'super_admin');
CREATE POLICY super_admin_rw_wallet_txn ON wallet_transactions
    USING (current_setting('app.role', true) = 'super_admin')
    WITH CHECK (current_setting('app.role', true) = 'super_admin');

CREATE TRIGGER trg_wallet_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_topup_updated_at BEFORE UPDATE ON wallet_topup_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_topup_tenant ON wallet_topup_requests(tenant_id, created_at DESC);
CREATE INDEX idx_topup_status  ON wallet_topup_requests(status, created_at DESC);
CREATE INDEX idx_wtxn_tenant   ON wallet_transactions(tenant_id, created_at DESC);
