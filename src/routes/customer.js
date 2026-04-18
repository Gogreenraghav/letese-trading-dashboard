const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');

const router = express.Router();

// GET /api/customer/dashboard
router.get('/dashboard', (req, res) => {
  try {
    const uid = req.user.id;
    const signals = db.prepare('SELECT * FROM signals WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(uid);
    const trades = db.prepare('SELECT * FROM trade_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(uid);
    const sCount = db.prepare('SELECT COUNT(*) as c FROM signals WHERE user_id = ?').get(uid);
    const exCount = db.prepare("SELECT COUNT(*) as c FROM signals WHERE user_id = ? AND status = 'executed'").get(uid);
    const tStats = db.prepare('SELECT COUNT(*) as c, SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins, SUM(COALESCE(pnl,0)) as pnl FROM trade_orders WHERE user_id = ?').get(uid);
    res.json({ signals, trades, stats: { totalSignals: sCount.c, executedSignals: exCount.c, totalTrades: tStats.c || 0, wins: tStats.wins || 0, winRate: tStats.c > 0 ? Math.round((tStats.wins/tStats.c)*100) : 0, totalPnl: tStats.pnl || 0 } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/customer/signals
router.get('/signals', (req, res) => {
  try {
    const { exchange, symbol, limit = 50 } = req.query;
    let q = 'SELECT * FROM signals WHERE user_id = ?';
    const params = [req.user.id];
    if (exchange) { q += ' AND exchange = ?'; params.push(exchange); }
    if (symbol) { q += ' AND symbol = ?'; params.push(symbol); }
    q += ' ORDER BY created_at DESC LIMIT ?'; params.push(parseInt(limit));
    const signals = db.prepare(q).all(...params);
    res.json({ signals });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/customer/trades
router.get('/trades', (req, res) => {
  try {
    const { symbol, side, limit = 50 } = req.query;
    let q = 'SELECT * FROM trade_orders WHERE user_id = ?';
    const params = [req.user.id];
    if (symbol) { q += ' AND symbol = ?'; params.push(symbol); }
    if (side) { q += ' AND side = ?'; params.push(side); }
    q += ' ORDER BY created_at DESC LIMIT ?'; params.push(parseInt(limit));
    const trades = db.prepare(q).all(...params);
    res.json({ trades });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/customer/overview
router.get('/overview', (req, res) => {
  try {
    const uid = req.user.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
    const cfg_ = db.prepare('SELECT * FROM auto_trade_configs WHERE user_id = ?').get(uid);
    const apiKeys = db.prepare('SELECT id, exchange, label, status, last_used_at FROM customer_api_keys WHERE user_id = ?').all(uid);
    const todaySignals = db.prepare("SELECT COUNT(*) as c FROM signals WHERE user_id = ? AND date(created_at) = date('now')").get(uid);
    const todayTrades = db.prepare("SELECT COUNT(*) as c, SUM(COALESCE(pnl,0)) as pnl FROM trade_orders WHERE user_id = ? AND date(created_at) = date('now')").get(uid);
    res.json({ user: { id: user.id, name: user.name, email: user.email, plan: user.plan, status: user.status, plan_valid_until: user.plan_valid_until }, autoTradeConfig: cfg_ || null, apiKeys, todaySignals: todaySignals.c, todayTrades: todayTrades.c, todayPnl: todayTrades.pnl || 0 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/customer/settings
router.put('/settings', (req, res) => {
  try {
    const uid = req.user.id;
    const { name, phone, settings } = req.body;
    if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, uid);
    if (phone) db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone, uid);
    if (settings) db.prepare('UPDATE users SET settings = ? WHERE id = ?').run(JSON.stringify(settings), uid);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/customer/auto-trade-config
router.get('/auto-trade-config', (req, res) => {
  try {
    const cfg_ = db.prepare('SELECT * FROM auto_trade_configs WHERE user_id = ?').get(req.user.id);
    res.json(cfg_ || { mode: 'combined', news_threshold_pct: 70, chart_threshold_pct: 60, whale_threshold_pct: 50, combined_threshold_pct: 70, news_weight_pct: 40, chart_weight_pct: 35, whale_weight_pct: 25, exchange: 'binance', trading_pair: 'BTCUSDT', position_size_pct: 10, stop_loss_pct: 2, take_profit_pct: 5, auto_trade_enabled: 0 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/customer/auto-trade-config
router.put('/auto-trade-config', (req, res) => {
  try {
    const uid = req.user.id;
    const { mode, news_threshold_pct, chart_threshold_pct, whale_threshold_pct, combined_threshold_pct, news_weight_pct, chart_weight_pct, whale_weight_pct, exchange, trading_pair, position_size_pct, stop_loss_pct, take_profit_pct, auto_trade_enabled } = req.body;
    const existing = db.prepare('SELECT id FROM auto_trade_configs WHERE user_id = ?').get(uid);
    if (existing) {
      db.prepare(`UPDATE auto_trade_configs SET mode=?, news_threshold_pct=?, chart_threshold_pct=?, whale_threshold_pct=?, combined_threshold_pct=?, news_weight_pct=?, chart_weight_pct=?, whale_weight_pct=?, exchange=?, trading_pair=?, position_size_pct=?, stop_loss_pct=?, take_profit_pct=?, auto_trade_enabled=?, updated_at=datetime('now') WHERE user_id=?`)
        .run(mode||'combined', news_threshold_pct||70, chart_threshold_pct||60, whale_threshold_pct||50, combined_threshold_pct||70, news_weight_pct||40, chart_weight_pct||35, whale_weight_pct||25, exchange||'binance', trading_pair||'BTCUSDT', position_size_pct||10, stop_loss_pct||2, take_profit_pct||5, auto_trade_enabled?1:0, uid);
    } else {
      db.prepare(`INSERT INTO auto_trade_configs (id, user_id, mode, news_threshold_pct, chart_threshold_pct, whale_threshold_pct, combined_threshold_pct, news_weight_pct, chart_weight_pct, whale_weight_pct, exchange, trading_pair, position_size_pct, stop_loss_pct, take_profit_pct, auto_trade_enabled) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(randomUUID(), uid, mode||'combined', news_threshold_pct||70, chart_threshold_pct||60, whale_threshold_pct||50, combined_threshold_pct||70, news_weight_pct||40, chart_weight_pct||35, whale_weight_pct||25, exchange||'binance', trading_pair||'BTCUSDT', position_size_pct||10, stop_loss_pct||2, take_profit_pct||5, auto_trade_enabled?1:0);
    }
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/customer/api-keys
router.put('/api-keys', (req, res) => {
  try {
    const uid = req.user.id;
    const { exchange, api_key, secret, api_secret, label } = req.body; var sec = secret || api_secret;
    const existing = db.prepare('SELECT id FROM customer_api_keys WHERE user_id = ? AND exchange = ?').get(uid, exchange);
    if (existing) {
      db.prepare('UPDATE customer_api_keys SET api_key_encrypted=?, secret_encrypted=?, label=?, status=? WHERE id=?')
        .run(api_key, sec, label||exchange, 'connected', existing.id);
    } else {
      db.prepare('INSERT INTO customer_api_keys (id, user_id, exchange, api_key_encrypted, secret_encrypted, label, status) VALUES (?,?,?,?,?,?,?)')
        .run(randomUUID(), uid, exchange, api_key, sec, label||exchange, 'connected');
    }
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/customer/api-keys
router.get('/api-keys', (req, res) => {
  try {
    const keys = db.prepare('SELECT id, exchange, label, status, last_used_at, created_at FROM customer_api_keys WHERE user_id = ?').all(req.user.id);
    res.json({ apiKeys: keys });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/customer/api-keys/:id
router.delete('/api-keys/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM customer_api_keys WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
