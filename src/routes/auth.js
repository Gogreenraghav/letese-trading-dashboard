const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const db = require('../db');
const cfg = require('../config');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = bcrypt.hashSync(password, 10);
    const id = randomUUID();
    const now = new Date().toISOString();
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`INSERT INTO users (id, email, password_hash, name, phone, role, plan, plan_valid_until, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, email.toLowerCase(), password_hash, name, phone || null, 'customer', 'signal_basic', validUntil, 'active');
    const token = jwt.sign({ id, email: email.toLowerCase(), role: 'customer' }, cfg.jwtSecret, { expiresIn: cfg.jwtExpires });
    res.status(201).json({ token, user: { id, email: email.toLowerCase(), name, phone, plan: 'signal_basic', role: 'customer', status: 'active' } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Account suspended' });
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(now, user.id);
    // Log login
    db.prepare('INSERT INTO login_logs (id, user_id, ip_address, success) VALUES (?, ?, ?, 1)')
      .run(randomUUID(), user.id, req.ip || 'unknown');
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, cfg.jwtSecret, { expiresIn: cfg.jwtExpires });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, plan: user.plan, role: user.role, status: user.status } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, cfg.jwtSecret);
    const user = db.prepare('SELECT id, email, name, phone, role, plan, plan_valid_until, two_fa_enabled, status, created_at, last_login FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ...user, two_fa_enabled: !!user.two_fa_enabled });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
