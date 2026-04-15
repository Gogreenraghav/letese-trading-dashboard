/**
 * Signals Routes — Save and retrieve trading signals
 */
const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require auth
router.use(authenticate);

// ── GET /api/signals — Get signals for current user ──────────────
router.get('/', async (req, res) => {
  const { limit = '50', strategy, action } = req.query;
  try {
    const conditions = [];
    const params = [];
    let idx = 1;

    // Show all signals to all users in demo mode
    // (in production, filter by req.user.id for multi-tenant)

    if (strategy) {
      conditions.push(`strategy = $${idx++}`);
      params.push(strategy);
    }
    if (action) {
      conditions.push(`action = $${idx++}`);
      params.push(action);
    }

    const limitVal = parseInt(limit) || 50;
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : 'WHERE 1=1';
    const result = await db.query(
      `SELECT * FROM signals ${whereClause} ORDER BY created_at DESC LIMIT ${limitVal}`,
      params
    );

    res.json({ signals: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Get signals error:', err);
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

// ── POST /api/signals — Save a new signal (from bot) ───────────
router.post('/', async (req, res) => {
  const { symbol, exchange, action, confidence, entry_price, target_price, stop_loss, strategy, timeframe, rationale, news_sentiment, technical_score } = req.body;

  if (!symbol || !action) {
    return res.status(400).json({ error: 'symbol and action required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO signals (user_id, symbol, exchange, action, confidence, entry_price, target_price, stop_loss, strategy, timeframe, rationale, news_sentiment, technical_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [req.user.id, symbol, exchange || 'NSE', action, confidence || null, entry_price || null,
       target_price || null, stop_loss || null, strategy || null, timeframe || '1d', rationale || null,
       news_sentiment || null, technical_score || null]
    );
    res.status(201).json({ signal: result.rows[0] });
  } catch (err) {
    console.error('Save signal error:', err);
    res.status(500).json({ error: 'Failed to save signal' });
  }
});

// ── GET /api/signals/stats ───────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [total, buySignals, sellSignals, todaySignals] = await Promise.all([
      db.query('SELECT COUNT(*) as c FROM signals'),
      db.query("SELECT COUNT(*) as c FROM signals WHERE action = 'BUY'"),
      db.query("SELECT COUNT(*) as c FROM signals WHERE action = 'SELL'"),
      db.query("SELECT COUNT(*) as c FROM signals WHERE created_at > NOW() - INTERVAL '24 hours'"),
    ]);

    res.json({
      total: parseInt(total.rows[0].c),
      buy: parseInt(buySignals.rows[0].c),
      sell: parseInt(sellSignals.rows[0].c),
      today: parseInt(todaySignals.rows[0].c),
    });
  } catch (err) {
    console.error('Signal stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── GET /api/signals/watchlist ────────────────────────────────────
router.get('/watchlist', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT w.*, s.action as latest_signal, s.confidence, s.created_at as signal_time
       FROM watchlists w
       LEFT JOIN LATERAL (
         SELECT action, confidence, created_at
         FROM signals
         WHERE symbol = w.symbol AND user_id = w.user_id
         ORDER BY created_at DESC LIMIT 1
       ) s ON true
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [req.user.id]
    );
    res.json({ watchlist: result.rows });
  } catch (err) {
    console.error('Watchlist error:', err);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// ── POST /api/signals/watchlist ───────────────────────────────────
router.post('/watchlist', async (req, res) => {
  const { symbol, exchange = 'NSE' } = req.body;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  try {
    await db.query(
      `INSERT INTO watchlists (user_id, symbol, exchange)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, symbol, exchange) DO NOTHING`,
      [req.user.id, symbol.toUpperCase(), exchange]
    );
    res.status(201).json({ message: 'Added to watchlist' });
  } catch (err) {
    console.error('Watchlist add error:', err);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// ── DELETE /api/signals/watchlist/:symbol ────────────────────────
router.delete('/watchlist/:symbol', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM watchlists WHERE user_id = $1 AND symbol = $2',
      [req.user.id, req.params.symbol.toUpperCase()]
    );
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

module.exports = router;
