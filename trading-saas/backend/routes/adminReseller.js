/**
 * Admin Reseller Routes — Multi-user team management + commissions
 */
const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

async function requireAdmin(req, res, next) {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}
router.use(requireAdmin);

// ── GET /api/admin/reseller/users ────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search, plan } = req.query;
    let query = `
      SELECT u.id, u.email, u.full_name, u.phone, u.plan,
             u.is_active, u.subscription_status, u.subscription_end,
             u.created_at, u.referred_by,
             p.plan_mode, p.auto_trade_enabled
      FROM users u
      LEFT JOIN plans p ON p.name = u.plan
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.email ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
    }
    if (plan && plan !== 'all') {
      params.push(plan);
      query += ` AND u.plan = $${params.length}`;
    }
    query += ' ORDER BY u.created_at DESC LIMIT 50';

    const result = await db.query(query, params);

    // Add broker status to each user
    const brokerRes = await db.query(
      `SELECT user_id, broker_status, is_verified, auto_trade_enabled, broker_name
       FROM broker_api_keys WHERE is_active = true`
    );
    const brokerMap = {};
    for (const b of brokerRes.rows) {
      brokerMap[b.user_id] = b;
    }

    // Revenue per user
    const revRes = await db.query(
      `SELECT user_id, COALESCE(SUM(amount_paise), 0) as total_revenue_paise
       FROM credit_transactions WHERE transaction_type = 'payment_pending' AND status = 'completed'
       GROUP BY user_id`
    );
    const revMap = {};
    for (const r of revRes.rows) revMap[r.user_id] = parseInt(r.total_revenue_paise) || 0;

    const users = result.rows.map(u => ({
      ...u,
      broker: brokerMap[u.id] || null,
      total_revenue: revMap[u.id] || 0,
    }));

    res.json({ users, total: users.length });
  } catch (err) {
    console.error('Reseller users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── PUT /api/admin/reseller/users/:id/plan ──────────────────────
router.put('/users/:id/plan', async (req, res) => {
  try {
    const { plan } = req.body;
    const { id } = req.params;

    const validPlans = ['free', 'basic', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });

    const result = await db.query(
      `UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2 RETURNING id, plan`,
      [plan, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// ── PUT /api/admin/reseller/users/:id/status ─────────────────────
router.put('/users/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;
    const result = await db.query(
      `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_active`,
      [is_active, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ── GET /api/admin/reseller/stats ────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE plan = 'enterprise') as enterprise_users,
        COUNT(*) FILTER (WHERE plan = 'pro') as pro_users,
        COUNT(*) FILTER (WHERE plan = 'basic') as basic_users,
        COUNT(*) FILTER (WHERE plan = 'free') as free_users,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
        COUNT(*) FILTER (WHERE subscription_status = 'active') as active_subs,
        COUNT(*) FILTER (WHERE subscription_end < NOW()) as expired_subs
      FROM users
    `);

    const revenue = await db.query(`
      SELECT
        COALESCE(SUM(w.total_spent_paise / 100.0), 0) as total_revenue_inr,
        COUNT(*) as total_transactions
      FROM (SELECT DISTINCT user_id, MAX(total_spent_paise) as total_spent_paise FROM user_wallets GROUP BY user_id) w
    `);

    const brokers = await db.query(`
      SELECT
        COUNT(*) as total_brokers,
        COUNT(*) FILTER (WHERE broker_status = 'connected') as connected,
        COUNT(*) FILTER (WHERE broker_status = 'pending_setup') as pending,
        COUNT(*) FILTER (WHERE is_verified = true) as verified
      FROM broker_api_keys
    `);

    res.json({
      users: stats.rows[0],
      revenue: revenue.rows[0],
      brokers: brokers.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── GET /api/admin/reseller/plans ────────────────────────────────
router.get('/plans', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT name, price_monthly_inr, plan_mode, auto_trade_enabled, max_trades_per_day,
             features, limits, is_active
      FROM plans WHERE is_active = true ORDER BY price_monthly_inr ASC
    `);
    res.json({ plans: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// ── POST /api/admin/reseller/users/:id/send-notification ─────────
router.post('/users/:id/send-notification', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const user = await db.query('SELECT id, email, full_name, telegram_chat_id FROM users WHERE id = $1', [req.params.id]);
    if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });

    // Log notification
    await db.query(
      `INSERT INTO admin_notifications (admin_id, user_id, message, sent_at)
       VALUES ($1, $2, $3, NOW())`,
      [req.user.id, req.params.id, message]
    );

    res.json({ success: true, message: 'Notification logged', user: user.rows[0].email });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router;
