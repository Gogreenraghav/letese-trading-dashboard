/**
 * Auth Routes — Signup, Login, Refresh
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');

const router = express.Router();

// ── Validations ────────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ── POST /api/auth/signup ──────────────────────────────────────────
router.post('/signup', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('phone').matches(/^\+?[0-9]{10,13}$/).withMessage('Valid phone required'),
  body('full_name').trim().isLength({ min: 2 }).withMessage('Full name required'),
], validate, async (req, res) => {
  const { email, password, phone, full_name, referrer_code } = req.body;

  try {
    // Check existing user
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Determine plan (check referrer later)
    const plan = 'free';

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, phone, password_hash, full_name, plan, is_active, is_admin, email_verified)
       VALUES ($1, $2, $3, $4, $5, true, false, true)
       RETURNING id, email, phone, full_name, plan, created_at`,
      [email, phone, password_hash, full_name, plan]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        plan: user.plan,
      },
      token,
      refreshToken,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      `SELECT id, email, phone, full_name, plan, is_admin, is_active,
              razorpay_customer_id, subscription_status, subscription_end,
              telegram_chat_id, max_stocks, max_strategies, live_trading,
              password_hash, created_at
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Remove password_hash from response
    delete user.password_hash;

    res.json({
      message: 'Login successful',
      user,
      token,
      refreshToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── POST /api/auth/refresh ─────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const result = await db.query(
      `SELECT id, email, plan, is_admin FROM users WHERE id = $1 AND is_active = true`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────────
router.get('/me', require('../middleware/auth').authenticate, (req, res) => {
  const { password_hash, ...user } = req.user;
  res.json({ user });
});

// ── POST /api/auth/change-password ────────────────────────────────
router.post('/change-password', [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 }),
], validate, require('../middleware/auth').authenticate, async (req, res) => {
  const { current_password, new_password } = req.body;

  try {
    const valid = await bcrypt.compare(current_password, req.user.password_hash || '');
    if (!valid) {
      return res.status(400).json({ error: 'Current password incorrect' });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
