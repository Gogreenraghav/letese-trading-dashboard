-- Trading SaaS Database Schema
-- Run this after connecting to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Subscription Plans ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trading_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    price_monthly INTEGER NOT NULL DEFAULT 0,  -- in INR paise (49900 = ₹499)
    price_yearly INTEGER,                      -- yearly price
    max_stocks INTEGER DEFAULT 5,
    max_positions INTEGER DEFAULT 3,
    strategies TEXT[] DEFAULT ARRAY['momentum'],
    telegram_enabled BOOLEAN DEFAULT false,
    live_trading BOOLEAN DEFAULT false,
    backtesting BOOLEAN DEFAULT false,
    api_access BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trading_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    
    -- Subscription
    plan_id UUID REFERENCES trading_plans(id),
    subscription_status VARCHAR(20) DEFAULT 'trial',  -- trial | active | cancelled | expired
    subscription_start TIMESTAMPTZ,
    subscription_end TIMESTAMPTZ,
    razorpay_customer_id VARCHAR(100),
    razorpay_subscription_id VARCHAR(100),
    
    -- Telegram
    telegram_chat_id BIGINT,
    telegram_bot_token VARCHAR(200),
    
    -- Trading Config
    initial_capital INTEGER DEFAULT 1000000,   -- ₹10 Lakh default
    max_risk_per_trade INTEGER DEFAULT 10,    -- 10% default
    preferred_strategy VARCHAR(50) DEFAULT 'momentum',
    trading_mode VARCHAR(20) DEFAULT 'paper',   -- paper | live
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Positions (Current Holdings) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS trading_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES trading_users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    entry_price DECIMAL(12,2) NOT NULL,
    current_price DECIMAL(12,2),
    entry_time TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    strategy VARCHAR(50),
    stop_loss DECIMAL(12,2),
    target_price DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'open',  -- open | closed
    notes TEXT,
    UNIQUE(user_id, symbol, status)
);

-- ── Trade History ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trading_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES trading_users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL,  -- BUY | SELL
    quantity INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    pnl DECIMAL(12,2),           -- profit/loss in ₹
    pnl_percent DECIMAL(6,2),
    strategy VARCHAR(50),
    signal_confidence DECIMAL(4,2),
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    broker_order_id VARCHAR(100),
    notes TEXT
);

-- ── Portfolio Snapshots (daily) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES trading_users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_value INTEGER NOT NULL,   -- total portfolio value in ₹
    cash INTEGER NOT NULL,
    invested INTEGER NOT NULL,
    positions_count INTEGER,
    day_pnl INTEGER DEFAULT 0,
    day_pnl_percent DECIMAL(6,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

-- ── Signals Log ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trading_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES trading_users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL,
    confidence DECIMAL(4,2),
    strategy VARCHAR(50),
    price DECIMAL(12,2),
    stop_loss DECIMAL(12,2),
    target DECIMAL(12,2),
    reason TEXT,
    executed BOOLEAN DEFAULT false,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscription Payments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES trading_users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES trading_plans(id),
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_order_id VARCHAR(100),
    razorpay_signature VARCHAR(200),
    amount INTEGER NOT NULL,  -- in paise
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending',  -- pending | completed | failed | refunded
    payment_method VARCHAR(50),
    invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Admin Logs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES trading_users(id),
    action VARCHAR(100) NOT NULL,
    target_user_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bot Sessions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES trading_users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'running',  -- running | stopped | error
    mode VARCHAR(20) DEFAULT 'paper',
    cycles_completed INTEGER DEFAULT 0,
    last_cycle_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_positions_user ON trading_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON trading_positions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trading_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_executed ON trading_trades(user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_user ON trading_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_executed ON trading_signals(user_id, executed);
CREATE INDEX IF NOT EXISTS idx_users_plan ON trading_users(plan_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON trading_users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON subscription_payments(user_id);

-- ── Default Plans Seed ─────────────────────────────────────────────
INSERT INTO trading_plans (name, display_name, price_monthly, max_stocks, max_positions, strategies, telegram_enabled, live_trading, backtesting, api_access) VALUES
    ('free', 'Free', 0, 5, 2, ARRAY['momentum'], false, false, false, false),
    ('basic', 'Basic', 49900, 20, 3, ARRAY['momentum', 'mean_reversion'], true, false, false, false),
    ('pro', 'Pro', 199900, 49, 5, ARRAY['momentum', 'mean_reversion', 'breakout', 'scalping', 'sector_rotation'], true, false, true, true),
    ('enterprise', 'Enterprise', 499900, 200, 10, ARRAY['momentum', 'mean_reversion', 'breakout', 'scalping', 'sector_rotation', 'options'], true, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- ── Admin User ─────────────────────────────────────────────────────
INSERT INTO trading_users (email, phone, password_hash, full_name, role, plan_id, subscription_status, subscription_start, subscription_end, is_active, is_verified)
SELECT 
    'admin@trading.com',
    '+919999999999',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGFJ.BhC3mG',  -- password: Admin@123
    'Admin',
    'super_admin',
    id,
    'active',
    NOW(),
    NOW() + INTERVAL '10 years',
    true,
    true
FROM trading_plans WHERE name = 'enterprise'
ON CONFLICT (email) DO NOTHING;
