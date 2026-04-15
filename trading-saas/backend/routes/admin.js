/**
 * Super Admin Routes — User Management, Plans, Analytics
 */
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { logAdminAction } = require('../middleware/adminLog');

const router = express.Router();

// All routes require auth + admin
router.use(authenticate, requireAdmin);

// ── Validation helper ──────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// ── GET /api/admin/stats ──────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, activeUsers, freeUsers, basicUsers, proUsers, entUsers,
      totalTrades, totalSignals, suspendedUsers,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) as c FROM users WHERE is_active = true OR is_active = false`),
      db.query(`SELECT COUNT(*) as c FROM users WHERE is_active = true`),
      db.query(`SELECT COUNT(*) as c FROM users WHERE plan = 'free'`),
      db.query(`SELECT COUNT(*) as c FROM users WHERE plan = 'basic'`),
      db.query(`SELECT COUNT(*) as c FROM users WHERE plan = 'pro'`),
      db.query(`SELECT COUNT(*) as c FROM users WHERE plan = 'enterprise'`),
      db.query(`SELECT COUNT(*) as c FROM signals`),
      db.query(`SELECT COUNT(*) as c FROM signals WHERE created_at > NOW() - INTERVAL '24 hours'`),
      db.query(`SELECT COUNT(*) as c FROM users WHERE is_active = false`),
    ]);

    // Revenue estimate (basic users)
    const revenue_basic = parseInt(basicUsers.rows[0].c) * 499;
    const revenue_pro   = parseInt(proUsers.rows[0].c) * 1999;
    const revenue_ent    = parseInt(entUsers.rows[0].c) * 4999;
    const mrr = revenue_basic + revenue_pro + revenue_ent;

    res.json({
      total_users: parseInt(totalUsers.rows[0].c),
      active_users: parseInt(activeUsers.rows[0].c),
      suspended_users: parseInt(suspendedUsers.rows[0].c),
      plan_breakdown: {
        free: parseInt(freeUsers.rows[0].c),
        basic: parseInt(basicUsers.rows[0].c),
        pro: parseInt(proUsers.rows[0].c),
        enterprise: parseInt(entUsers.rows[0].c),
      },
      signals_today: parseInt(totalSignals.rows[0].c),
      total_trades: parseInt(totalTrades.rows[0].c),
      estimated_mrr: mrr,
      estimated_arr: mrr * 12,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────
router.get('/users', async (req, res) => {
  const { plan, status, search, page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = ['1=1'];
    const params = [];
    let paramIdx = 1;

    if (plan) {
      where.push(`plan = $${paramIdx++}`);
      params.push(plan);
    }
    if (status === 'active') {
      where.push(`is_active = true`);
    } else if (status === 'suspended') {
      where.push(`is_active = false`);
    }
    if (search) {
      where.push(`(email ILIKE $${paramIdx} OR full_name ILIKE $${paramIdx} OR phone ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = where.join(' AND ');

    const [usersRes, countRes] = await Promise.all([
      db.query(
        `SELECT id, email, phone, full_name, plan, is_admin, is_active,
                subscription_status, telegram_chat_id, max_stocks, max_strategies,
                live_trading, created_at, updated_at
         FROM users
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
        [...params, parseInt(limit), offset]
      ),
      db.query(`SELECT COUNT(*) as c FROM users WHERE ${whereClause}`, params),
    ]);

    res.json({
      users: usersRes.rows,
      total: parseInt(countRes.rows[0].c),
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(parseInt(countRes.rows[0].c) / parseInt(limit)),
    });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── GET /api/admin/users/:id ──────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const userRes = await db.query(
      `SELECT id, email, phone, full_name, plan, is_admin, is_active,
              subscription_status, subscription_end, razorpay_customer_id,
              telegram_chat_id, telegram_username, max_stocks, max_strategies,
              live_trading, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's portfolios, trades, signals
    const [portfolios, trades, signals] = await Promise.all([
      db.query(`SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [req.params.id]),
      db.query(`SELECT * FROM trades WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [req.params.id]),
      db.query(`SELECT * FROM signals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [req.params.id]),
    ]);

    res.json({
      user: userRes.rows[0],
      portfolios: portfolios.rows,
      trades: trades.rows,
      signals: signals.rows,
    });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── GET /api/admin/users/email/:email ────────────────────────────
router.get('/users/email/:email', async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id, email, full_name, plan, is_admin, is_active, created_at FROM users WHERE email = $1',
      [req.params.email]
    );
    if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to find user' });
  }
});

// ── PUT /api/admin/users/:id/plan ────────────────────────────────
router.put('/users/:id/plan', [
  body('plan').isIn(['free', 'basic', 'pro', 'enterprise']),
], validate, async (req, res) => {
  const { plan } = req.body;
  const { id } = req.params;

  try {
    const userRes = await db.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.query('UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2', [plan, id]);
    await logAdminAction(req.user.id, 'CHANGE_PLAN', id, { new_plan: plan }, req.ip);

    res.json({ message: `Plan updated to ${plan}`, plan });
  } catch (err) {
    console.error('Admin plan update error:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// ── PUT /api/admin/users/:id/status ──────────────────────────────
router.put('/users/:id/status', [
  body('is_active').isBoolean(),
  body('reason').optional().isString(),
], validate, async (req, res) => {
  const { is_active, reason } = req.body;
  const { id } = req.params;

  try {
    await db.query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [is_active, id]);
    await logAdminAction(req.user.id, is_active ? 'ACTIVATE_USER' : 'SUSPEND_USER', id, { reason }, req.ip);

    res.json({ message: is_active ? 'User activated' : 'User suspended', is_active });
  } catch (err) {
    console.error('Admin status update error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ── PUT /api/admin/users/:id/limits ───────────────────────────────
router.put('/users/:id/limits', [
  body('max_stocks').optional().isInt({ min: -1 }),
  body('max_strategies').optional().isInt({ min: -1 }),
  body('live_trading').optional().isBoolean(),
], validate, async (req, res) => {
  const { max_stocks, max_strategies, live_trading } = req.body;
  const { id } = req.params;

  try {
    const updates = [];
    const params = [];
    let idx = 1;

    if (max_stocks !== undefined) { updates.push(`max_stocks = $${idx++}`); params.push(max_stocks); }
    if (max_strategies !== undefined) { updates.push(`max_strategies = $${idx++}`); params.push(max_strategies); }
    if (live_trading !== undefined) { updates.push(`live_trading = $${idx++}`); params.push(live_trading); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(id);
    await db.query(`UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx}`, params);
    await logAdminAction(req.user.id, 'UPDATE_LIMITS', id, { max_stocks, max_strategies, live_trading }, req.ip);

    const updated = await db.query('SELECT max_stocks, max_strategies, live_trading FROM users WHERE id = $1', [id]);
    res.json({ message: 'Limits updated', limits: updated.rows[0] });
  } catch (err) {
    console.error('Admin limits update error:', err);
    res.status(500).json({ error: 'Failed to update limits' });
  }
});

// ── GET /api/admin/logs ───────────────────────────────────────────
router.get('/logs', async (req, res) => {
  const { page = '1', limit = '50' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [logs, count] = await Promise.all([
      db.query(
        `SELECT l.id, l.action, l.target_user_id, l.details, l.ip_address, l.created_at,
                u.email as admin_email, t.email as target_email
         FROM admin_logs l
         LEFT JOIN users u ON l.admin_id = u.id
         LEFT JOIN users t ON l.target_user_id = t.id
         ORDER BY l.created_at DESC
         LIMIT $1 OFFSET $2`,
        [parseInt(limit), offset]
      ),
      db.query('SELECT COUNT(*) as c FROM admin_logs'),
    ]);

    res.json({
      logs: logs.rows,
      total: parseInt(count.rows[0].c),
      page: parseInt(page),
    });
  } catch (err) {
    console.error('Admin logs error:', err);
    res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
});

// ── GET /api/admin/plans ──────────────────────────────────────────
router.get('/plans', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, price_monthly_inr, features, limits, is_active, created_at
       FROM plans ORDER BY price_monthly_inr ASC`
    );
    res.json({ plans: result.rows });
  } catch (err) {
    console.error('Admin plans error:', err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// ── GET /api/admin/signals ────────────────────────────────────────
router.get('/signals', async (req, res) => {
  const { limit = '50' } = req.query;
  try {
    const result = await db.query(
      `SELECT s.*, u.email as user_email, u.plan
       FROM signals s
       LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    res.json({ signals: result.rows });
  } catch (err) {
    console.error('Admin signals error:', err);
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

module.exports = router;
