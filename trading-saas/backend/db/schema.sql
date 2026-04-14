-- Trading SaaS Database Schema
-- Run: psql -U postgres -d trading_saas -f schema.sql

-- ── Users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    plan            VARCHAR(20) NOT NULL DEFAULT 'free'
                        CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'suspended', 'pending', 'deleted')),
    razorpay_customer_id  VARCHAR(100),
    subscription_id       VARCHAR(100),
    subscription_status   VARCHAR(20) DEFAULT 'inactive',
    subscription_end     DATE,
    telegram_chat_id      BIGINT,
    referral_code         VARCHAR(20),
    referred_by           UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ── User Portfolios ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_portfolios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol          VARCHAR(50) NOT NULL,
    exchange        VARCHAR(10) DEFAULT 'NSE',
    quantity        DECIMAL(12,4) NOT NULL DEFAULT 0,
    avg_price       DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_price   DECIMAL(12,2) DEFAULT 0,
    pnl             DECIMAL(12,2) DEFAULT 0,
    pnl_pct         DECIMAL(8,4) DEFAULT 0,
    status          VARCHAR(10) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'sold')),
    strategy        VARCHAR(50),
    broker_order_id VARCHAR(100),
    opened_at       TIMESTAMPTZ DEFAULT NOW(),
    closed_at       TIMESTAMPTZ,
    UNIQUE(user_id, symbol, broker_order_id)
);

-- ── User Trades ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_trades (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol          VARCHAR(50) NOT NULL,
    exchange        VARCHAR(10) DEFAULT 'NSE',
    action          VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL')),
    quantity        DECIMAL(12,4) NOT NULL,
    price           DECIMAL(12,2) NOT NULL,
    amount          DECIMAL(14,2) NOT NULL,
    brokerage       DECIMAL(10,2) DEFAULT 0,
    pnl             DECIMAL(12,2),
    strategy        VARCHAR(50),
    order_id        VARCHAR(100),
    executed_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscription Plans ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(30) NOT NULL UNIQUE,
    price_monthly_inr INT NOT NULL DEFAULT 0,
    features        JSONB NOT NULL DEFAULT '[]',
    limits          JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Admin Audit Logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id   UUID REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    target_user_id  UUID REFERENCES users(id),
    details         JSONB DEFAULT '{}',
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Watchlist ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_watchlist (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol          VARCHAR(50) NOT NULL,
    exchange        VARCHAR(10) DEFAULT 'NSE',
    added_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, symbol, exchange)
);

-- ── Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan  ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_portfolios_user ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user    ON user_trades(user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_user_id, created_at DESC);

-- ── Seed Plans ─────────────────────────────────────────────────────
INSERT INTO plans (name, price_monthly_inr, features, limits) VALUES
    ('free', 0, '["dashboard_view","paper_trading","5_stocks","daily_signals"]',
     '{"stocks":5,"strategies":1,"telegram_alerts":false}'),
    ('basic', 499, '["dashboard","paper_trading","20_stocks","1_strategy","email_alerts"]',
     '{"stocks":20,"strategies":1,"telegram_alerts":false}'),
    ('pro', 1999, '["all_basic","unlimited_stocks","all_strategies","telegram_alerts","live_signals","api_access"]',
     '{"stocks":-1,"strategies":5,"telegram_alerts":true}'),
    ('enterprise', 4999, '["all_pro","unlimited","white_label","custom_strategies","sla","multi_user"]',
     '{"stocks":-1,"strategies":-1,"users":-1,"telegram_alerts":true}')
ON CONFLICT (name) DO NOTHING;
