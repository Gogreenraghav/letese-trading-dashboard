/**
 * JWT Authentication Middleware
 * NSE-BSE Trading SaaS
 */
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'nse-bse-trading-saas-secret-key';

/**
 * Verify JWT token and attach user to request
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch fresh user data from DB
    const result = await db.query(
      `SELECT id, email, phone, full_name, plan, is_admin, is_active,
              razorpay_customer_id, subscription_status, subscription_end,
              telegram_chat_id, max_stocks, max_strategies, live_trading,
              created_at
       FROM users WHERE id = $1 AND is_active = true`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Require super_admin role
 */
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Generate JWT access token
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      plan: user.plan,
      isAdmin: user.is_admin,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'refresh') return null;
    return decoded;
  } catch {
    return null;
  }
}

module.exports = { authenticate, requireAdmin, generateToken, generateRefreshToken, verifyRefreshToken };
