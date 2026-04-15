const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// All routes require auth
router.use(authenticate);

const db = require('../config/database');

// ── GET /api/broker/keys ──────────────────────────────────────────
router.get('/keys', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, broker_name, api_key, is_active, is_verified, created_at
       FROM broker_api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ brokers: result.rows.map(b => ({ ...b, api_key: b.api_key ? '***' + b.api_key.slice(-6) : null })) });
  } catch (err) {
    console.error('Get brokers error:', err);
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

// ── POST /api/broker/keys ─────────────────────────────────────────
router.post('/keys', async (req, res) => {
  try {
    const { broker_name, api_key, api_secret, access_token } = req.body;
    if (!broker_name || !api_key) return res.status(400).json({ error: 'broker_name and api_key required' });

    const result = await db.query(
      `INSERT INTO broker_api_keys (user_id, broker_name, api_key, api_secret, access_token)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, broker_name, is_active`,
      [req.user.id, broker_name, api_key, api_secret || null, access_token || null]
    );
    res.json({ success: true, broker: result.rows[0] });
  } catch (err) {
    console.error('Add broker error:', err);
    res.status(500).json({ error: 'Failed to add broker' });
  }
});

// ── DELETE /api/broker/keys/:id ──────────────────────────────────
router.delete('/keys/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM broker_api_keys WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete broker' });
  }
});

// ── PUT /api/broker/keys/:id/activate ─────────────────────────────
router.put('/keys/:id/activate', async (req, res) => {
  try {
    // Deactivate all other brokers for this user
    await db.query('UPDATE broker_api_keys SET is_active = false WHERE user_id = $1', [req.user.id]);
    await db.query('UPDATE broker_api_keys SET is_active = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate broker' });
  }
});

module.exports = router;
