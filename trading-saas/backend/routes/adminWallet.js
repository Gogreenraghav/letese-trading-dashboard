/**
 * Admin Wallet Routes — Manual top-up for users (offline payment system)
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

// ── GET /api/admin/wallet/users — All users with wallet balance ──
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.full_name, u.plan,
             u.is_active, u.subscription_status, u.created_at,
             COALESCE(w.credits_balance, 0) as credits_balance,
             COALESCE(w.total_spent_paise, 0) as total_spent_paise,
             COALESCE(w.credits_balance * 100, 0) as wallet_balance_paise
      FROM users u
      LEFT JOIN user_wallets w ON w.user_id = u.id
      ORDER BY COALESCE(w.credits_balance, 0) DESC
    `);

    const totalBalance = result.rows.reduce((sum, u) => sum + parseInt(u.wallet_balance_paise || 0), 0);

    res.json({
      users: result.rows.map(u => ({
        ...u,
        wallet_balance: (parseInt(u.wallet_balance_paise || 0) / 100).toFixed(2),
        wallet_balance_paise: parseInt(u.wallet_balance_paise || 0),
      })),
      total_wallet_balance: (totalBalance / 100).toFixed(2),
      total_wallet_balance_paise: totalBalance,
    });
  } catch (err) {
    console.error('Admin wallet users error:', err);
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

// ── GET /api/admin/wallet/users/:id — Single user wallet details ──
router.get('/users/:id', async (req, res) => {
  try {
    const userRes = await db.query(`
      SELECT u.id, u.email, u.full_name, u.plan, u.is_active,
             COALESCE(w.credits_balance, 0) as credits_balance,
             COALESCE(w.total_spent_paise, 0) as total_spent_paise
      FROM users u
      LEFT JOIN user_wallets w ON w.user_id = u.id
      WHERE u.id = $1
    `, [req.params.id]);

    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });

    // Transaction history
    const txns = await db.query(`
      SELECT id, amount, transaction_type, description, status, created_at
      FROM credit_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.params.id]);

    const u = userRes.rows[0];
    res.json({
      user: {
        ...u,
        wallet_balance: (parseInt(u.credits_balance || 0) * 100 / 100).toFixed(2),
        credits_balance: parseInt(u.credits_balance || 0),
        total_spent: (parseInt(u.total_spent_paise || 0) / 100).toFixed(2),
      },
      transactions: txns.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

// ── POST /api/admin/wallet/topup — Add balance to user wallet ────
router.post('/topup', async (req, res) => {
  try {
    const { user_id, amount_rs, note } = req.body;

    if (!user_id || !amount_rs) {
      return res.status(400).json({ error: 'user_id and amount_rs required' });
    }

    const amountRs = parseFloat(amount_rs);
    if (isNaN(amountRs) || amountRs <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // amount_rs = rupees, convert to credits (1 credit = ₹1 for now, or custom rate)
    // Or: amount_rs in rupees, credits = amount_rs (1₹ = 1 credit)
    const creditsToAdd = Math.floor(amountRs); // 1 ₹ = 1 credit
    const amountPaise = Math.round(amountRs * 100);

    // Get user
    const userRes = await db.query('SELECT id, email, full_name FROM users WHERE id = $1', [user_id]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });

    // Upsert wallet
    await db.query(`
      INSERT INTO user_wallets (user_id, credits_balance, total_spent_paise)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET
        credits_balance = user_wallets.credits_balance + $2,
        total_spent_paise = user_wallets.total_spent_paise + $3,
        updated_at = NOW()
    `, [user_id, creditsToAdd, amountPaise]);

    // Log transaction
    await db.query(`
      INSERT INTO credit_transactions (user_id, amount, transaction_type, description, status)
      VALUES ($1, $2, 'admin_topup', $3, 'completed')
    `, [user_id, creditsToAdd, note || `Admin top-up: ₹${amountRs} (+${creditsToAdd} credits)`]);

    // Get updated balance
    const updated = await db.query('SELECT credits_balance FROM user_wallets WHERE user_id = $1', [user_id]);
    const newBalance = parseInt(updated.rows[0]?.credits_balance || 0);

    console.log(`[ADMIN TOPUP] ${userRes.rows[0].email}: ₹${amountRs} → +${creditsToAdd} credits | New balance: ${newBalance}`);

    res.json({
      success: true,
      message: `₹${amountRs} added — ${creditsToAdd} credits to ${userRes.rows[0].full_name || userRes.rows[0].email}`,
      user: userRes.rows[0].email,
      amount_added_rs: amountRs,
      credits_added: creditsToAdd,
      new_balance: newBalance,
    });
  } catch (err) {
    console.error('Admin topup error:', err);
    res.status(500).json({ error: 'Failed to top up: ' + err.message });
  }
});

// ── POST /api/admin/wallet/deduct — Deduct balance from user wallet ──
router.post('/deduct', async (req, res) => {
  try {
    const { user_id, amount_rs, note } = req.body;

    if (!user_id || !amount_rs) {
      return res.status(400).json({ error: 'user_id and amount_rs required' });
    }

    const amountRs = parseFloat(amount_rs);
    if (isNaN(amountRs) || amountRs <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const creditsToDeduct = Math.floor(amountRs);

    const userRes = await db.query('SELECT id, email, full_name FROM users WHERE id = $1', [user_id]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });

    const wallet = await db.query('SELECT credits_balance FROM user_wallets WHERE user_id = $1', [user_id]);
    const currentBalance = parseInt(wallet.rows[0]?.credits_balance || 0);

    if (currentBalance < creditsToDeduct) {
      return res.status(400).json({
        error: `Insufficient balance. Current: ${currentBalance} credits, Requested: ${creditsToDeduct}`,
        current_balance: currentBalance,
      });
    }

    await db.query(`
      UPDATE user_wallets SET credits_balance = credits_balance - $2, updated_at = NOW()
      WHERE user_id = $1
    `, [user_id, creditsToDeduct]);

    await db.query(`
      INSERT INTO credit_transactions (user_id, amount, transaction_type, description, status)
      VALUES ($1, $2, 'admin_deduct', $3, 'completed')
    `, [user_id, -creditsToDeduct, note || `Admin deduction: ₹${amountRs}`]);

    const updated = await db.query('SELECT credits_balance FROM user_wallets WHERE user_id = $1', [user_id]);

    res.json({
      success: true,
      message: `₹${amountRs} deducted from ${userRes.rows[0].full_name || userRes.rows[0].email}`,
      credits_deducted: creditsToDeduct,
      new_balance: parseInt(updated.rows[0]?.credits_balance || 0),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deduct: ' + err.message });
  }
});

module.exports = router;
