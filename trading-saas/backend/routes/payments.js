/**
 * Payments Routes — Razorpay Payment Gateway Integration
 * Handles: create order, verify payment, add credits
 */
const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/payments/status — Public (no auth needed) ──────────
router.get('/status', (req, res) => {
  const configured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  res.json({
    razorpay_configured: configured,
    mode: configured
      ? (process.env.RAZORPAY_KEY_ID.startsWith('rzp_') ? 'test' : 'live')
      : 'not_configured',
    key_id: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.slice(0, 12) + '...' : null,
  });
});

// All other routes require auth
router.use(authenticate);

// ── Lazy-load Razorpay (env vars may not be set yet) ─────────────
function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ── POST /api/payments/create-order ───────────────────────────────
// Creates a Razorpay order for a credit package purchase
router.post('/create-order', async (req, res) => {
  const { package_id } = req.body;

  if (!package_id) {
    return res.status(400).json({ error: 'package_id required' });
  }

  try {
    // Get package details
    const pkg = await db.query(
      'SELECT id, name, credits, price_paise, description FROM credit_packages WHERE id = $1 AND is_active = true',
      [package_id]
    );

    if (!pkg.rows[0]) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const { name, credits, price_paise, description } = pkg.rows[0];
    const userId = req.user.id;

    // Check if Razorpay is configured
    const razorpay = getRazorpay();
    if (!razorpay) {
      // Demo mode — no Razorpay configured, simulate instant purchase
      await addCreditsToWallet(userId, credits, `Purchased ${credits} credits — ${name} plan (demo)`);
      const updated = await db.query('SELECT credits_balance FROM user_wallets WHERE user_id = $1', [userId]);

      return res.json({
        demo_mode: true,
        message: 'Demo purchase (Razorpay not configured)',
        credits_added: credits,
        new_balance: updated.rows[0].credits_balance,
        razorpay_configured: false,
        hint: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env to enable live payments',
      });
    }

    // Create Razorpay order
    const receipt = `cr_${userId.slice(0, 8)}_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: price_paise,
      currency: 'INR',
      receipt,
      notes: {
        user_id: userId,
        package_id: String(package_id),
        package_name: name,
        credits: String(credits),
      },
    });

    // Save pending payment
    await db.query(
      `INSERT INTO credit_transactions (user_id, amount, transaction_type, description, razorpay_order_id, status)
       VALUES ($1, $2, 'payment_pending', $3, $4, 'pending')`,
      [userId, credits, `${credits} credits — ${name} plan`, order.id]
    );

    res.json({
      razorpay_configured: true,
      demo_mode: false,
      order_id: order.id,
      amount: price_paise,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
      package_name: name,
      credits,
      receipt,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order: ' + err.message });
  }
});

// ── POST /api/payments/verify ─────────────────────────────────────
// Verifies Razorpay payment signature and adds credits
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits_added, package_name } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  try {
    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (razorpay_signature !== expectedSignature) {
      console.error('Razorpay signature mismatch:', { expected: expectedSignature, received: razorpay_signature });
      return res.status(400).json({ error: 'Payment verification failed — signature mismatch' });
    }

    // Mark transaction as completed
    const txResult = await db.query(
      `UPDATE credit_transactions
       SET status = 'completed'
       WHERE razorpay_order_id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING *`,
      [razorpay_order_id, req.user.id]
    );

    if (txResult.rows.length === 0) {
      // Transaction might already be processed — check if credits were added
      return res.status(400).json({ error: 'Transaction not found or already processed' });
    }

    const tx = txResult.rows[0];
    const creditsToAdd = tx.amount;

    // Add credits to wallet
    await addCreditsToWallet(req.user.id, creditsToAdd, `Purchased ${creditsToAdd} credits — ${package_name || 'Razorpay'}`);
    const updated = await db.query('SELECT credits_balance FROM user_wallets WHERE user_id = $1', [req.user.id]);

    res.json({
      success: true,
      verified: true,
      credits_added: creditsToAdd,
      new_balance: updated.rows[0].credits_balance,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Payment verification failed: ' + err.message });
  }
});

// ── POST /api/payments/webhook ────────────────────────────────────
// Razorpay webhook handler (no auth — uses webhook secret)
router.post('/webhook', async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  if (!signature) {
    return res.status(400).json({ error: 'Missing webhook signature' });
  }

  // Verify webhook signature
  if (webhookSecret) {
    const expected = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(req.body)).digest('hex');
    if (signature !== expected) {
      console.error('Webhook signature mismatch');
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  }

  const event = req.body.event;
  const payload = req.body.payload || {};

  try {
    if (event === 'payment.captured') {
      const orderId = payload.order?.entity?.receipt;
      const paymentId = payload.payment?.entity?.id;
      const amount = payload.payment?.entity?.amount;

      // Find pending transaction
      const tx = await db.query(
        `SELECT id, user_id, amount FROM credit_transactions
         WHERE razorpay_order_id = $1 AND status = 'pending' LIMIT 1`,
        [orderId]
      );

      if (tx.rows.length > 0) {
        const { user_id, amount: credits, id: txId } = tx.rows[0];
        await db.query(`UPDATE credit_transactions SET status = 'completed' WHERE id = $1`, [txId]);
        await addCreditsToWallet(user_id, credits, 'Credit purchase via Razorpay webhook');
        console.log(`✅ Webhook: Added ${credits} credits to user ${user_id}`);
      }
    } else if (event === 'payment.failed') {
      const orderId = payload.order?.entity?.receipt;
      await db.query(
        `UPDATE credit_transactions SET status = 'failed' WHERE razorpay_order_id = $1`,
        [orderId]
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ── Helper: add credits to wallet ─────────────────────────────────
async function addCreditsToWallet(userId, credits, description) {
  await db.query(
    `INSERT INTO user_wallets (user_id, credits_balance, total_spent_paise)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET
       credits_balance = user_wallets.credits_balance + $2,
       total_spent_paise = user_wallets.total_spent_paise + $3,
       updated_at = NOW()`,
    [userId, credits, 0]
  );
}

module.exports = router;
