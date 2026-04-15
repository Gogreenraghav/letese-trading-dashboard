const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// All routes require auth
router.use(authenticate);

// ── GET /api/credits/packages ─────────────────────────────────────
router.get('/packages', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, credits, price_paise, description FROM credit_packages WHERE is_active = true ORDER BY price_paise ASC'
    );
    const packages = result.rows.map(p => ({
      ...p,
      price_inr: (p.price_paise / 100).toFixed(2),
      price_display: `₹${(p.price_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
    }));
    res.json({ packages });
  } catch (err) {
    console.error('Get packages error:', err);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// ── GET /api/credits/wallet ───────────────────────────────────────
router.get('/wallet', async (req, res) => {
  try {
    const userId = req.user.id;
    const [walletResult, txResult] = await Promise.all([
      db.query('SELECT credits_balance, total_spent_paise FROM user_wallets WHERE user_id = $1', [userId]),
      db.query(
        'SELECT amount, transaction_type, description, created_at FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
        [userId]
      ),
    ]);

    let wallet = walletResult.rows[0];
    if (!wallet) {
      await db.query('INSERT INTO user_wallets (user_id, credits_balance) VALUES ($1, 500)', [userId]);
      wallet = { credits_balance: 500, total_spent_paise: 0 };
    }

    res.json({
      balance: wallet.credits_balance,
      total_spent: (wallet.total_spent_paise / 100).toFixed(2),
      transactions: txResult.rows,
    });
  } catch (err) {
    console.error('Get wallet error:', err.message);
    res.status(500).json({ error: 'Failed to fetch wallet', detail: err.message });
  }
});

// ── POST /api/credits/purchase ────────────────────────────────────
router.post('/purchase', async (req, res) => {
  try {
    const { package_id } = req.body;
    if (!package_id) return res.status(400).json({ error: 'package_id required' });

    const pkg = await db.query('SELECT * FROM credit_packages WHERE id = $1 AND is_active = true', [package_id]);
    if (!pkg.rows[0]) return res.status(404).json({ error: 'Package not found' });

    const credits = pkg.rows[0].credits;
    const pricePaise = pkg.rows[0].price_paise;
    const userId = req.user.id;

    await db.query(
      `INSERT INTO user_wallets (user_id, credits_balance, total_spent_paise)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         credits_balance = user_wallets.credits_balance + $2,
         total_spent_paise = user_wallets.total_spent_paise + $3,
         updated_at = NOW()`,
      [userId, credits, pricePaise]
    );

    await db.query(
      'INSERT INTO credit_transactions (user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
      [userId, credits, 'purchase', `Purchased ${credits} credits — ${pkg.rows[0].name} plan`]
    );

    const updated = await db.query('SELECT credits_balance FROM user_wallets WHERE user_id = $1', [userId]);
    res.json({ success: true, credits_added: credits, new_balance: updated.rows[0].credits_balance });
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// ── POST /api/credits/deduct ───────────────────────────────────────
router.post('/deduct', async (req, res) => {
  try {
    const { amount = 1, description } = req.body;
    const userId = req.user.id;

    const wallet = await db.query('SELECT credits_balance FROM user_wallets WHERE user_id = $1', [userId]);
    const balance = wallet.rows[0]?.credits_balance || 0;

    if (balance < amount) {
      return res.status(402).json({ error: 'Insufficient credits', balance, required: amount });
    }

    await db.query(
      'UPDATE user_wallets SET credits_balance = credits_balance - $1, updated_at = NOW() WHERE user_id = $2',
      [amount, userId]
    );
    await db.query(
      "INSERT INTO credit_transactions (user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)",
      [userId, -amount, 'trade_deduction', description || `Trade execution`]
    );

    res.json({ success: true, deducted: amount, new_balance: balance - amount });
  } catch (err) {
    console.error('Deduct error:', err);
    res.status(500).json({ error: 'Deduction failed' });
  }
});

module.exports = router;
