/**
 * Analytics Routes — User P&L & Performance Analytics
 */
const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── GET /api/analytics/summary ───────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;

    // Overall stats
    const overall = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'closed') as total_trades,
        COUNT(*) FILTER (WHERE pnl_paise > 0 AND status = 'closed') as winning_trades,
        COUNT(*) FILTER (WHERE pnl_paise < 0 AND status = 'closed') as losing_trades,
        COALESCE(SUM(pnl_paise) FILTER (WHERE status = 'closed'), 0) as net_pnl_paise,
        COALESCE(SUM(pnl_paise) FILTER (WHERE pnl_paise > 0 AND status = 'closed'), 0) as gross_profit_paise,
        COALESCE(SUM(pnl_paise) FILTER (WHERE pnl_paise < 0 AND status = 'closed'), 0) as gross_loss_paise,
        COALESCE(AVG(pnl_paise) FILTER (WHERE status = 'closed'), 0) as avg_pnl_paise,
        COALESCE(MAX(pnl_paise), 0) as best_trade_paise,
        COALESCE(MIN(pnl_paise), 0) as worst_trade_paise
      FROM trade_logs WHERE user_id = $1`,
      [userId]
    );

    // Monthly P&L (last 6 months)
    const monthly = await db.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', executed_at), 'YYYY-MM') as month,
        TO_CHAR(DATE_TRUNC('month', executed_at), 'Mon YYYY') as month_label,
        COUNT(*) FILTER (WHERE status = 'closed') as trades,
        COUNT(*) FILTER (WHERE pnl_paise > 0 AND status = 'closed') as wins,
        COALESCE(SUM(pnl_paise) FILTER (WHERE status = 'closed'), 0) as pnl_paise,
        COALESCE(AVG(pnl_paise) FILTER (WHERE status = 'closed'), 0) as avg_pnl_paise
      FROM trade_logs
      WHERE user_id = $1 AND executed_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', executed_at)
      ORDER BY DATE_TRUNC('month', executed_at) ASC`,
      [userId]
    );

    // By strategy
    const byStrategy = await db.query(`
      SELECT
        COALESCE(strategy, 'unknown') as strategy,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE pnl_paise > 0) as wins,
        COUNT(*) FILTER (WHERE pnl_paise < 0) as losses,
        COALESCE(SUM(pnl_paise), 0) as pnl_paise,
        ROUND(COUNT(*) FILTER (WHERE pnl_paise > 0)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) as win_rate
      FROM trade_logs
      WHERE user_id = $1 AND status = 'closed'
      GROUP BY COALESCE(strategy, 'unknown')
      ORDER BY SUM(pnl_paise) DESC`,
      [userId]
    );

    // By stock
    const byStock = await db.query(`
      SELECT
        symbol,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE pnl_paise > 0) as wins,
        COALESCE(SUM(pnl_paise), 0) as pnl_paise,
        ROUND(COUNT(*) FILTER (WHERE pnl_paise > 0)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) as win_rate
      FROM trade_logs
      WHERE user_id = $1 AND status = 'closed'
      GROUP BY symbol
      ORDER BY SUM(pnl_paise) DESC`,
      [userId]
    );

    // Cumulative P&L over time
    const cumulative = await db.query(`
      WITH daily AS (
        SELECT
          DATE(executed_at) as trade_date,
          SUM(pnl_paise) as daily_pnl
        FROM trade_logs
        WHERE user_id = $1 AND status = 'closed'
        GROUP BY DATE(executed_at)
        ORDER BY DATE(executed_at) ASC
      )
      SELECT
        trade_date,
        daily_pnl,
        SUM(daily_pnl) OVER (ORDER BY trade_date ROWS UNBOUNDED PRECEDING) as cumulative_pnl
      FROM daily`,
      [userId]
    );

    // Weekly performance (last 4 weeks)
    const weekly = await db.query(`
      SELECT
        DATE_TRUNC('week', executed_at) as week_start,
        COUNT(*) as trades,
        COALESCE(SUM(pnl_paise), 0) as pnl_paise
      FROM trade_logs
      WHERE user_id = $1 AND status = 'closed' AND executed_at >= NOW() - INTERVAL '4 weeks'
      GROUP BY DATE_TRUNC('week', executed_at)
      ORDER BY week_start ASC`,
      [userId]
    );

    // Best & worst trades
    const bestTrade = await db.query(`
      SELECT symbol, action, entry_price, exit_price, pnl_paise, strategy, executed_at
      FROM trade_logs WHERE user_id = $1 AND status = 'closed'
      ORDER BY pnl_paise DESC LIMIT 1`,
      [userId]
    );

    const worstTrade = await db.query(`
      SELECT symbol, action, entry_price, exit_price, pnl_paise, strategy, executed_at
      FROM trade_logs WHERE user_id = $1 AND status = 'closed'
      ORDER BY pnl_paise ASC LIMIT 1`,
      [userId]
    );

    const s = overall.rows[0];
    const totalTrades = parseInt(s.total_trades) || 0;
    const winRate = totalTrades > 0
      ? ((parseInt(s.winning_trades) / totalTrades) * 100).toFixed(1)
      : '0.0';

    res.json({
      summary: {
        total_trades: totalTrades,
        winning_trades: parseInt(s.winning_trades) || 0,
        losing_trades: parseInt(s.losing_trades) || 0,
        win_rate: parseFloat(winRate),
        net_pnl: (parseInt(s.net_pnl_paise) / 100).toFixed(2),
        gross_profit: (parseInt(s.gross_profit_paise) / 100).toFixed(2),
        gross_loss: (Math.abs(parseInt(s.gross_loss_paise)) / 100).toFixed(2),
        avg_trade_pnl: (parseInt(s.avg_pnl_paise) / 100).toFixed(2),
        best_trade: { pnl: (parseInt(s.best_trade_paise) / 100).toFixed(2), ...bestTrade.rows[0] },
        worst_trade: { pnl: (parseInt(s.worst_trade_paise) / 100).toFixed(2), ...worstTrade.rows[0] },
      },
      monthly: monthly.rows.map(r => ({
        month: r.month,
        label: r.month_label,
        trades: parseInt(r.trades),
        wins: parseInt(r.wins),
        pnl: (parseInt(r.pnl_paise) / 100).toFixed(2),
        avg: (parseInt(r.avg_pnl_paise) / 100).toFixed(2),
      })),
      by_strategy: byStrategy.rows.map(r => ({
        strategy: r.strategy,
        total: parseInt(r.total),
        wins: parseInt(r.wins),
        losses: parseInt(r.losses),
        pnl: (parseInt(r.pnl_paise) / 100).toFixed(2),
        win_rate: parseFloat(r.win_rate) || 0,
      })),
      by_stock: byStock.rows.map(r => ({
        symbol: r.symbol,
        total: parseInt(r.total),
        wins: parseInt(r.wins),
        pnl: (parseInt(r.pnl_paise) / 100).toFixed(2),
        win_rate: parseFloat(r.win_rate) || 0,
      })),
      cumulative: cumulative.rows.map(r => ({
        date: r.trade_date,
        daily_pnl: (parseInt(r.daily_pnl) / 100).toFixed(2),
        cumulative_pnl: (parseInt(r.cumulative_pnl) / 100).toFixed(2),
      })),
      weekly: weekly.rows.map(r => ({
        week: r.week_start,
        trades: parseInt(r.trades),
        pnl: (parseInt(r.pnl_paise) / 100).toFixed(2),
      })),
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics: ' + err.message });
  }
});

module.exports = router;
