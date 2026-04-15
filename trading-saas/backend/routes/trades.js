const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// All routes require auth
router.use(authenticate);

const db = require('../config/database');

// ── GET /api/trades ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { limit = '50', status } = req.query;
    let query = 'SELECT * FROM trade_logs WHERE user_id = $1';
    const params = [req.user.id];

    if (status && status !== 'all') {
      query += ' AND status = $2';
      params.push(status);
    }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    // Stats
    const stats = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'closed') as total_trades,
         COUNT(*) FILTER (WHERE pnl_paise > 0 AND status = 'closed') as profitable,
         COALESCE(SUM(pnl_paise) FILTER (WHERE status = 'closed'), 0) as total_pnl_paise,
         COALESCE(SUM(pnl_paise) FILTER (WHERE pnl_paise > 0 AND status = 'closed'), 0) as total_profit_paise,
         COALESCE(SUM(ABS(pnl_paise)) FILTER (WHERE pnl_paise < 0 AND status = 'closed'), 0) as total_loss_paise
       FROM trade_logs WHERE user_id = $1`,
      [req.user.id]
    );

    const s = stats.rows[0];
    const totalTrades = parseInt(s.total_trades) || 0;
    const profitable = parseInt(s.profitable) || 0;
    res.json({
      trades: result.rows,
      stats: {
        total_trades: totalTrades,
        profitable_trades: profitable,
        win_rate: totalTrades > 0 ? ((profitable / totalTrades) * 100).toFixed(1) : 0,
        total_pnl: (parseInt(s.total_pnl_paise) / 100).toFixed(2),
        total_profit: (parseInt(s.total_profit_paise) / 100).toFixed(2),
        total_loss: (parseInt(s.total_loss_paise) / 100).toFixed(2),
      },
    });
  } catch (err) {
    console.error('Get trades error:', err);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// ── POST /api/trades (bot logs a trade) ──────────────────────────
router.post('/', async (req, res) => {
  try {
    const { signal_id, symbol, exchange, action, quantity, entry_price, broker_order_id } = req.body;
    const userId = req.user.id;

    // Deduct credit first
    const wallet = await db.query('SELECT credits_balance FROM user_wallets WHERE user_id = $1', [userId]);
    const balance = wallet.rows[0]?.credits_balance || 0;

    if (balance < 1) {
      return res.status(402).json({ error: 'Insufficient credits for trade' });
    }

    await db.query('UPDATE user_wallets SET credits_balance = credits_balance - 1 WHERE user_id = $1', [userId]);
    await db.query(
      "INSERT INTO credit_transactions (user_id, amount, transaction_type, description) VALUES ($1, -1, 'trade_deduction', $2)",
      [userId, `Trade: ${action} ${symbol}`]
    );

    const result = await db.query(
      `INSERT INTO trade_logs (user_id, signal_id, symbol, exchange, action, quantity, entry_price, broker_order_id, status, executed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'open',NOW()) RETURNING *`,
      [userId, signal_id || null, symbol, exchange || 'NSE', action, quantity || 1, entry_price, broker_order_id || null]
    );

    res.json({ success: true, trade: result.rows[0] });
  } catch (err) {
    console.error('Log trade error:', err);
    res.status(500).json({ error: 'Failed to log trade' });
  }
});

// ── PUT /api/trades/:id/close ────────────────────────────────────
router.put('/:id/close', async (req, res) => {
  try {
    const { exit_price, pnl_paise, status = 'closed' } = req.body;
    const result = await db.query(
      `UPDATE trade_logs SET exit_price = $1, pnl_paise = $2, status = $3, closed_at = NOW()
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [exit_price, pnl_paise || 0, status, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Trade not found' });
    res.json({ success: true, trade: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to close trade' });
  }
});

module.exports = router;
