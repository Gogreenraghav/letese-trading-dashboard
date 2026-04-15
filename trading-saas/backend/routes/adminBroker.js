/**
 * Admin Broker Routes — Super Admin manages all users' broker API keys
 */
const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── Helper: require admin ─────────────────────────────────────────
async function requireAdmin(req, res, next) {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

router.use(requireAdmin);

// ── GET /api/admin/brokers — All users' broker connections ────────
router.get('/', async (req, res) => {
  try {
    const { status, broker } = req.query;

    let query = `
      SELECT
        b.id,
        b.user_id,
        u.email as user_email,
        u.full_name,
        u.plan,
        b.broker_name,
        b.api_key,
        b.is_verified,
        b.auto_trade_enabled,
        b.broker_status,
        b.is_active,
        b.created_at
      FROM broker_api_keys b
      JOIN users u ON u.id = b.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND b.broker_status = $${params.length}`;
    }
    if (broker && broker !== 'all') {
      params.push(broker);
      query += ` AND b.broker_name = $${params.length}`;
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await db.query(query, params);

    // Stats summary
    const stats = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE broker_status = 'connected') as connected,
        COUNT(*) FILTER (WHERE broker_status = 'pending_setup') as pending,
        COUNT(*) FILTER (WHERE broker_status = 'disconnected') as disconnected,
        COUNT(*) FILTER (WHERE broker_status = 'error') as error,
        COUNT(*) FILTER (WHERE is_verified = true) as verified,
        COUNT(*) FILTER (WHERE auto_trade_enabled = true) as auto_trade_active
      FROM broker_api_keys
    `);

    const s = stats.rows[0];
    res.json({
      brokers: result.rows.map(b => ({
        ...b,
        api_key: b.api_key ? '••••' + b.api_key.slice(-6) : null,
        api_secret_masked: '••••••••',
      })),
      stats: {
        connected: parseInt(s.connected),
        pending: parseInt(s.pending),
        disconnected: parseInt(s.disconnected),
        error: parseInt(s.error),
        verified: parseInt(s.verified),
        auto_trade_active: parseInt(s.auto_trade_active),
        total: result.rows.length,
      }
    });
  } catch (err) {
    console.error('Admin brokers error:', err);
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

// ── GET /api/admin/brokers/users/:userId — Single user's brokers ──
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userRes = await db.query(
      'SELECT id, email, full_name, plan FROM users WHERE id = $1',
      [userId]
    );
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });

    const brokers = await db.query(
      `SELECT id, broker_name, api_key, is_verified, auto_trade_enabled,
              broker_status, is_active, created_at
       FROM broker_api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ user: userRes.rows[0], brokers: brokers.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user brokers' });
  }
});

// ── POST /api/admin/brokers — Add broker for a user ──────────────
router.post('/', async (req, res) => {
  try {
    const { user_id, broker_name, api_key, api_secret } = req.body;

    if (!user_id || !broker_name || !api_key) {
      return res.status(400).json({ error: 'user_id, broker_name, and api_key required' });
    }

    // Verify user exists
    const userRes = await db.query('SELECT id, email FROM users WHERE id = $1', [user_id]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });

    const result = await db.query(
      `INSERT INTO broker_api_keys (user_id, broker_name, api_key, api_secret, is_verified, auto_trade_enabled, broker_status)
       VALUES ($1, $2, $3, $4, false, false, 'pending_setup')
       RETURNING id, broker_name, user_id, broker_status, created_at`,
      [user_id, broker_name, api_key, api_secret || null]
    );

    res.json({ success: true, broker: result.rows[0], user: userRes.rows[0] });
  } catch (err) {
    console.error('Admin add broker error:', err);
    res.status(500).json({ error: 'Failed to add broker: ' + err.message });
  }
});

// ── PUT /api/admin/brokers/:id — Update broker settings ───────────
router.put('/:id', async (req, res) => {
  try {
    const { is_verified, auto_trade_enabled, broker_status } = req.body;
    const { id } = req.params;

    const updates = [];
    const values = [];
    let param = 1;

    if (typeof is_verified === 'boolean') {
      updates.push(`is_verified = $${param++}`);
      values.push(is_verified);
    }
    if (typeof auto_trade_enabled === 'boolean') {
      updates.push(`auto_trade_enabled = $${param++}`);
      values.push(auto_trade_enabled);
    }
    if (broker_status) {
      updates.push(`broker_status = $${param++}`);
      values.push(broker_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await db.query(
      `UPDATE broker_api_keys SET ${updates.join(', ')} WHERE id = $${param}
       RETURNING id, broker_name, user_id, is_verified, auto_trade_enabled, broker_status`,
      values
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Broker not found' });

    res.json({ success: true, broker: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update broker' });
  }
});

// ── DELETE /api/admin/brokers/:id — Remove broker ─────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM broker_api_keys WHERE id = $1 RETURNING id, broker_name',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Broker not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete broker' });
  }
});

// ── PUT /api/admin/brokers/:id/verify — Verify + activate broker ──
router.put('/:id/verify', async (req, res) => {
  try {
    const { broker_status = 'connected' } = req.body;
    const result = await db.query(
      `UPDATE broker_api_keys
       SET is_verified = true, broker_status = $2, auto_trade_enabled = true, is_active = true
       WHERE id = $1
       RETURNING id, broker_name, user_id, is_verified, auto_trade_enabled, broker_status`,
      [req.params.id, broker_status]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Broker not found' });
    res.json({ success: true, broker: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify broker' });
  }
});

// ── PUT /api/admin/brokers/:id/disconnect ─────────────────────────
router.put('/:id/disconnect', async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE broker_api_keys
       SET is_verified = false, broker_status = 'disconnected', auto_trade_enabled = false, is_active = false
       WHERE id = $1
       RETURNING id, broker_name, broker_status`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Broker not found' });
    res.json({ success: true, broker: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect broker' });
  }
});

module.exports = router;
