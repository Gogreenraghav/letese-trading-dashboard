const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, '../data/trading_saas.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    plan TEXT DEFAULT 'basic',
    plan_valid_until TEXT,
    two_fa_enabled INTEGER DEFAULT 0,
    api_keys TEXT DEFAULT '{}',
    settings TEXT DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    plan TEXT,
    amount_paise BIGINT,
    currency TEXT DEFAULT 'USDT',
    payment_id TEXT,
    payment_method TEXT,
    payment_status TEXT,
    crypto_txn_id TEXT,
    started_at TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS signals (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    symbol TEXT,
    direction TEXT,
    confidence INTEGER,
    exchange TEXT,
    news_headline TEXT,
    news_sentiment_pct INTEGER,
    chart_pattern TEXT,
    chart_score INTEGER,
    whale_signal TEXT,
    whale_score INTEGER,
    combined_score INTEGER,
    status TEXT DEFAULT 'pending',
    triggered_by TEXT,
    delivered_via TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trade_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    signal_id TEXT,
    symbol TEXT,
    side TEXT,
    quantity REAL,
    price REAL,
    exchange TEXT,
    order_type TEXT,
    pnl REAL,
    status TEXT,
    triggered_by TEXT,
    news_headline TEXT,
    news_sentiment_pct INTEGER,
    chart_pattern TEXT,
    chart_score INTEGER,
    whale_signal TEXT,
    whale_score INTEGER,
    combined_score INTEGER,
    decision_summary TEXT,
    executed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS auto_trade_configs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    mode TEXT DEFAULT 'combined',
    news_threshold_pct INTEGER DEFAULT 70,
    chart_threshold_pct INTEGER DEFAULT 60,
    whale_threshold_pct INTEGER DEFAULT 50,
    combined_threshold_pct INTEGER DEFAULT 70,
    news_weight_pct INTEGER DEFAULT 40,
    chart_weight_pct INTEGER DEFAULT 35,
    whale_weight_pct INTEGER DEFAULT 25,
    exchange TEXT DEFAULT 'binance',
    trading_pair TEXT DEFAULT 'BTCUSDT',
    position_size_pct INTEGER DEFAULT 10,
    stop_loss_pct INTEGER DEFAULT 2,
    take_profit_pct INTEGER DEFAULT 5,
    auto_trade_enabled INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS login_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    ip_address TEXT,
    user_agent TEXT,
    login_at TEXT DEFAULT (datetime('now')),
    success INTEGER DEFAULT 1,
    failure_reason TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_apis (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    base_url TEXT,
    api_key_encrypted TEXT,
    secret_encrypted TEXT,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_news_apis (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    base_url TEXT,
    api_key_encrypted TEXT,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_notification_apis (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    config TEXT DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customer_api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    exchange TEXT,
    api_key_encrypted TEXT,
    secret_encrypted TEXT,
    label TEXT,
    status TEXT DEFAULT 'connected',
    last_used_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    channel TEXT,
    signal_id TEXT,
    trade_id TEXT,
    content TEXT,
    status TEXT,
    sent_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    price_paise BIGINT DEFAULT 0,
    currency TEXT DEFAULT 'USDT',
    validity_days INTEGER DEFAULT 30,
    features TEXT DEFAULT '{}',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed admin user if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@zummptrade.com');
if (!adminExists) {
  const hash = bcrypt.hashSync('Admin@123', 10);
  db.prepare(`INSERT INTO users (id, email, password_hash, name, role, plan, status) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(require('crypto').randomUUID(), 'admin@zummptrade.com', hash, 'Admin', 'admin', 'enterprise', 'active');
  console.log('Admin user created: admin@zummptrade.com / Admin@123');
}

// Seed default packages
const pkgCount = db.prepare('SELECT COUNT(*) as c FROM packages').get().c;
if (pkgCount === 0) {
  const { randomUUID } = require('crypto');
  const pkgs = [
    { id: randomUUID(), name: 'Signal Basic', slug: 'signal_basic', price: 99, currency: 'USDT', features: JSON.stringify({ signals: true, algo_trade: false, exchanges: 1, news_threshold: 70 }) },
    { id: randomUUID(), name: 'Signal Pro', slug: 'signal_pro', price: 199, currency: 'USDT', features: JSON.stringify({ signals: true, algo_trade: false, exchanges: 3, chart_analysis: true, news_threshold: 65 }) },
    { id: randomUUID(), name: 'Signal Enterprise', slug: 'signal_enterprise', price: 250, currency: 'USDT', features: JSON.stringify({ signals: true, algo_trade: false, exchanges: 999, custom_threshold: true }) },
    { id: randomUUID(), name: 'Algo Basic', slug: 'algo_basic', price: 299, currency: 'USDT', features: JSON.stringify({ signals: true, algo_trade: true, algo_modes: ['news_only'], exchanges: 1 }) },
    { id: randomUUID(), name: 'Algo Pro', slug: 'algo_pro', price: 499, currency: 'USDT', features: JSON.stringify({ signals: true, algo_trade: true, algo_modes: ['news_only','chart_only','combined'], exchanges: 3, chart_analysis: true }) },
    { id: randomUUID(), name: 'Algo Enterprise', slug: 'algo_enterprise', price: 799, currency: 'USDT', features: JSON.stringify({ signals: true, algo_trade: true, algo_modes: ['news_only','chart_only','combined'], exchanges: 999, custom_api: true, backtest: true }) },
  ];
  pkgs.forEach(p => {
    db.prepare('INSERT INTO packages (id, name, slug, price_paise, currency, features) VALUES (?, ?, ?, ?, ?, ?)')
      .run(p.id, p.name, p.slug, p.price, p.currency, p.features);
  });
  console.log('Packages seeded');
}

module.exports = db;
