const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');

const router = express.Router();

// GET /api/admin/overview
router.get('/overview', (req, res) => {
  try {
    const totalCustomers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role != 'admin'").get();
    const activePlans = db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'active' AND role != 'admin'").get();
    const revenue = db.prepare("SELECT SUM(amount_paise) as t FROM subscriptions WHERE payment_status = 'completed'").get();
    const signalsToday = db.prepare("SELECT COUNT(*) as c FROM signals WHERE date(created_at) = date('now')").get();
    const tradesToday = db.prepare("SELECT COUNT(*) as c FROM trade_orders WHERE date(created_at) = date('now')").get();
    const autoTradesToday = db.prepare("SELECT COUNT(*) as c FROM trade_orders WHERE date(created_at) = date('now')").get();
    res.json({ totalCustomers: totalCustomers.c, activePlans: activePlans.c, revenue: (revenue.t || 0) / 100, signalsToday: signalsToday.c, tradesToday: tradesToday.c });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/customers
router.get('/customers', (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let q = "SELECT id, email, name, phone, role, plan, plan_valid_until, two_fa_enabled, status, created_at, last_login, notification_channel, telegram_chat_id, whatsapp_number, email_alternate FROM users WHERE role != 'admin'";
    const params = [];
    if (search) { q += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    q += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'; params.push(parseInt(limit), offset);
    const customers = db.prepare(q).all(...params);
    const total = db.prepare("SELECT COUNT(*) as c FROM users WHERE role != 'admin'").get().c;
    res.json({ customers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/customers/:id
router.get('/customers/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, phone, role, plan, plan_valid_until, two_fa_enabled, status, api_keys, settings, notification_channel, telegram_chat_id, whatsapp_number, email_alternate, created_at, last_login FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Customer not found' });
    const signals = db.prepare('SELECT * FROM signals WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.params.id);
    const trades = db.prepare('SELECT * FROM trade_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.params.id);
    const loginLogs = db.prepare('SELECT * FROM login_logs WHERE user_id = ? ORDER BY login_at DESC LIMIT 20').all(req.params.id);
    const autoCfg = db.prepare('SELECT * FROM auto_trade_configs WHERE user_id = ?').get(req.params.id);
    const apiKeys = db.prepare('SELECT id, exchange, label, status, last_used_at FROM customer_api_keys WHERE user_id = ?').all(req.params.id);
    const subs = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ ...user, signals, trades, loginLogs, autoConfig: autoCfg, apiKeys, subscriptions: subs });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/admin/customers/:id/plan
router.put('/customers/:id/plan', (req, res) => {
  try {
    const { plan } = req.body;
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('UPDATE users SET plan = ?, plan_valid_until = ? WHERE id = ?').run(plan, validUntil, req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/admin/customers/:id/notification
router.put('/customers/:id/notification', (req, res) => {
  try {
    const { notification_channel, telegram_chat_id, whatsapp_number, email_alternate } = req.body;
    db.prepare('UPDATE users SET notification_channel=COALESCE(?,notification_channel), telegram_chat_id=COALESCE(?,telegram_chat_id), whatsapp_number=COALESCE(?,whatsapp_number), email_alternate=COALESCE(?,email_alternate) WHERE id=?')
      .run(notification_channel||null, telegram_chat_id||null, whatsapp_number||null, email_alternate||null, req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/admin/customers/:id/status
router.put('/customers/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/admin/customers/:id
router.delete('/customers/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ? AND role != ?').run(req.params.id, 'admin');
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/apis (trading)
router.get('/apis', (req, res) => {
  try {
    const apis = db.prepare('SELECT * FROM admin_apis ORDER BY priority ASC').all();
    res.json({ apis });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/admin/apis
router.post('/apis', (req, res) => {
  try {
    const { name, type, base_url, api_key, secret, priority } = req.body;
    const id = randomUUID();
    db.prepare('INSERT INTO admin_apis (id, name, type, base_url, api_key_encrypted, secret_encrypted, priority, status) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, name, type, base_url, api_key||'', secret||'', priority||1, 'active');
    res.json({ success: true, id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/admin/apis/:id
router.put('/apis/:id', (req, res) => {
  try {
    const { name, base_url, api_key, secret, priority, status } = req.body;
    db.prepare('UPDATE admin_apis SET name=COALESCE(?,name), base_url=COALESCE(?,base_url), api_key_encrypted=COALESCE(?,api_key_encrypted), secret_encrypted=COALESCE(?,secret_encrypted), priority=COALESCE(?,priority), status=COALESCE(?,status) WHERE id=?')
      .run(name||null, base_url||null, api_key||null, secret||null, priority||null, status||null, req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/admin/apis/:id
router.delete('/apis/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM admin_apis WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/news-apis
router.get('/news-apis', (req, res) => {
  try {
    const apis = db.prepare('SELECT * FROM admin_news_apis ORDER BY priority ASC').all();
    res.json({ apis });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/admin/news-apis
router.post('/news-apis', (req, res) => {
  try {
    const { name, type, base_url, api_key, priority } = req.body;
    const id = randomUUID();
    db.prepare('INSERT INTO admin_news_apis (id, name, type, base_url, api_key_encrypted, priority, status) VALUES (?,?,?,?,?,?,?)')
      .run(id, name, type, base_url, api_key||'', priority||1, 'active');
    res.json({ success: true, id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/admin/news-apis/:id
router.delete('/news-apis/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM admin_news_apis WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/notification-apis
router.get('/notification-apis', (req, res) => {
  try {
    const apis = db.prepare('SELECT * FROM admin_notification_apis ORDER BY priority ASC').all();
    res.json({ apis });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/admin/notification-apis
router.post('/notification-apis', (req, res) => {
  try {
    const { name, type, config, priority } = req.body;
    const id = randomUUID();
    db.prepare('INSERT INTO admin_notification_apis (id, name, type, config, priority, status) VALUES (?,?,?,?,?,?)')
      .run(id, name, type, JSON.stringify(config||{}), priority||1, 'active');
    res.json({ success: true, id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/admin/notification-apis/:id
router.delete('/notification-apis/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM admin_notification_apis WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/reports
router.get('/reports', (req, res) => {
  try {
    const { user_id, from, to } = req.query;
    let q = 'SELECT * FROM trade_orders WHERE 1=1';
    const params = [];
    if (user_id) { q += ' AND user_id = ?'; params.push(user_id); }
    if (from) { q += ' AND created_at >= ?'; params.push(from); }
    if (to) { q += ' AND created_at <= ?'; params.push(to); }
    q += ' ORDER BY created_at DESC LIMIT 200';
    const trades = db.prepare(q).all(...params);
    const revenue = db.prepare("SELECT SUM(amount_paise) as t FROM subscriptions WHERE payment_status = 'completed'").get();
    res.json({ trades, totalRevenue: (revenue.t || 0) / 100 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/packages
router.get('/packages', (req, res) => {
  try {
    const packages = db.prepare('SELECT * FROM packages ORDER BY price_paise ASC').all();
    res.json({ packages });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/admin/packages/:id
router.put('/packages/:id', (req, res) => {
  try {
    const { name, price_paise, features, is_active } = req.body;
    db.prepare('UPDATE packages SET name=COALESCE(?,name), price_paise=COALESCE(?,price_paise), features=COALESCE(?,features), is_active=COALESCE(?,is_active) WHERE id=?')
      .run(name||null, price_paise||null, features?JSON.stringify(features):null, is_active!==undefined?is_active?1:0:null, req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
