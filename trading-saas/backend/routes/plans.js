/**
 * Plans Routes — User-facing plan info, upgrades, plan comparison
 */
const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/plans — List all active plans ───────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, price_monthly_inr, plan_mode, auto_trade_enabled,
              max_trades_per_day, features, limits, is_active
       FROM plans WHERE is_active = true
       ORDER BY price_monthly_inr ASC`
    );

    const plans = result.rows.map(plan => {
      const features = Array.isArray(plan.features) ? plan.features : [];
      const limits = typeof plan.limits === 'object' ? plan.limits : {};
      return {
        id: plan.id,
        name: plan.name,
        display_name: plan.name.charAt(0).toUpperCase() + plan.name.slice(1),
        price_monthly: plan.price_monthly_inr,
        price_monthly_display: `₹${(plan.price_monthly_inr / 100).toFixed(0)}`,
        plan_mode: plan.plan_mode,
        mode_label: plan.plan_mode === 'signal_only' ? '📊 Signals Only'
                  : plan.plan_mode === 'auto_trade' ? '🤖 Auto Trade'
                  : '📊 + 🤖 Both',
        auto_trade_enabled: plan.auto_trade_enabled,
        max_trades_per_day: plan.max_trades_per_day,
        features,
        limits,
        is_free: plan.name === 'free',
      };
    });

    res.json({ plans });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// ── GET /api/plans/compare — Plan comparison matrix ───────────────
router.get('/compare', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT name, price_monthly_inr, plan_mode, auto_trade_enabled,
              max_trades_per_day, features, limits
       FROM plans WHERE is_active = true ORDER BY price_monthly_inr ASC`
    );

    const compareRows = [
      { label: 'Monthly Price', key: 'price' },
      { label: 'Trading Mode', key: 'plan_mode' },
      { label: 'Auto Trading', key: 'auto_trade' },
      { label: 'Max Trades/Day', key: 'max_trades' },
      { label: 'Stocks Limit', key: 'stocks' },
      { label: 'Strategies', key: 'strategies' },
      { label: 'Telegram Alerts', key: 'telegram' },
      { label: 'Live Signals', key: 'live_signals' },
      { label: 'Broker API', key: 'broker_api' },
      { label: 'Stop Loss', key: 'stop_loss' },
      { label: 'Bracket Orders', key: 'brackets' },
      { label: 'Multi-User', key: 'multi_user' },
      { label: 'White Label', key: 'white_label' },
    ];

    const plans = result.rows.map(plan => {
      const features = Array.isArray(plan.features) ? plan.features : [];
      const limits = typeof plan.limits === 'object' ? plan.limits : {};
      return {
        name: plan.name,
        price: `₹${(plan.price_monthly_inr / 100).toFixed(0)}/mo`,
        plan_mode: plan.plan_mode === 'signal_only' ? '📊 Signal' : plan.plan_mode === 'auto_trade' ? '🤖 Auto' : '📊+🤖',
        auto_trade: plan.auto_trade_enabled ? '✅' : '❌',
        max_trades: plan.max_trades_per_day || '❌',
        stocks: limits.stocks === -1 ? 'Unlimited' : limits.stocks || 5,
        strategies: limits.strategies === -1 ? 'All' : limits.strategies || 1,
        telegram: features.includes('telegram_alerts') ? '✅' : '❌',
        live_signals: features.includes('live_signals') ? '✅' : '❌',
        broker_api: features.includes('broker_api') ? '✅' : '❌',
        stop_loss: features.includes('stop_loss') ? '✅' : '❌',
        brackets: features.includes('brackets') ? '✅' : '❌',
        multi_user: features.includes('multi_user') ? '✅' : '❌',
        white_label: features.includes('white_label') ? '✅' : '❌',
      };
    });

    res.json({ compare: compareRows, plans });
  } catch (err) {
    console.error('Compare plans error:', err);
    res.status(500).json({ error: 'Failed to compare plans' });
  }
});

// ── GET /api/plans/my — Current user's plan details ─────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const user = await db.query(
      `SELECT u.plan, u.subscription_status, u.subscription_end, p.*
       FROM users u
       JOIN plans p ON p.name = u.plan
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const row = user.rows[0];
    const features = Array.isArray(row.features) ? row.features : [];
    const limits = typeof row.limits === 'object' ? row.limits : {};

    res.json({
      plan: {
        name: row.plan,
        display_name: row.name.charAt(0).toUpperCase() + row.name.slice(1),
        price_monthly: row.price_monthly_inr,
        plan_mode: row.plan_mode,
        mode_label: row.plan_mode === 'signal_only' ? '📊 Signals Only'
                  : row.plan_mode === 'auto_trade' ? '🤖 Auto Trade'
                  : '📊 + 🤖 Both',
        auto_trade_enabled: row.auto_trade_enabled,
        max_trades_per_day: row.max_trades_per_day,
        features,
        limits,
        is_upgradable: row.name !== 'enterprise',
      },
      subscription: {
        status: row.subscription_status,
        end: row.subscription_end,
        is_expired: row.subscription_end ? new Date(row.subscription_end) < new Date() : false,
      }
    });
  } catch (err) {
    console.error('My plan error:', err);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// ── POST /api/plans/upgrade — Upgrade user plan ─────────────────
router.post('/upgrade', authenticate, async (req, res) => {
  const { plan_name } = req.body;

  if (!plan_name) return res.status(400).json({ error: 'plan_name required' });

  try {
    const planRes = await db.query('SELECT * FROM plans WHERE name = $1 AND is_active = true', [plan_name]);
    if (planRes.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = planRes.rows[0];

    // Check if upgrading to auto-trade plan — require broker config
    if (plan.auto_trade_enabled && plan.plan_mode !== 'signal_only') {
      const brokerRes = await db.query(
        `SELECT is_verified FROM broker_api_keys WHERE user_id = $1 AND is_verified = true LIMIT 1`,
        [req.user.id]
      );
      if (brokerRes.rows.length === 0) {
        return res.status(400).json({
          error: 'Broker API required for Auto Trade plans',
          hint: 'Please configure your broker API keys in Settings before upgrading to this plan',
        });
      }
    }

    const subscription_end = new Date();
    subscription_end.setMonth(subscription_end.getMonth() + 1);

    await db.query(
      `UPDATE users SET plan = $1, subscription_status = 'active',
       subscription_start = CURRENT_DATE, subscription_end = $2, updated_at = NOW()
       WHERE id = $3`,
      [plan_name, subscription_end, req.user.id]
    );

    res.json({
      message: `Upgraded to ${plan.name}`,
      plan: plan_name,
      subscription_end: subscription_end,
    });
  } catch (err) {
    console.error('Upgrade plan error:', err);
    res.status(500).json({ error: 'Failed to upgrade plan' });
  }
});

module.exports = router;