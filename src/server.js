const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const cfg = require('./config');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const publicDir = path.join(__dirname, '../public');

// Static files first
app.use(express.static(publicDir));

// Protected routes — check JWT and redirect to login.html if invalid
app.get('/dashboard', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.redirect('/login.html?next=/dashboard.html');
  try {
    jwt.verify(token, cfg.jwtSecret);
    res.sendFile(path.join(publicDir, 'dashboard.html'));
  } catch {
    res.redirect('/login.html?next=/dashboard.html');
  }
});

app.get('/admin', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.redirect('/login.html?next=/admin.html');
  try {
    const decoded = jwt.verify(token, cfg.jwtSecret);
    if (decoded.role !== 'admin') return res.redirect('/dashboard.html');
    res.sendFile(path.join(publicDir, 'admin.html'));
  } catch {
    res.redirect('/login.html?next=/admin.html');
  }
});

// Serve .html files without extension for other public pages
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (req.path === '/dashboard' || req.path === '/admin') return next();
  const htmlFile = path.join(publicDir, req.path + '.html');
  if (fs.existsSync(htmlFile)) return res.sendFile(htmlFile);
  next();
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customer', require('./middleware/auth').auth, require('./routes/customer'));
app.use('/api/admin', require('./middleware/auth').auth, require('./middleware/auth').adminOnly, require('./routes/admin'));

// Admin login page (separate from customer login)
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin-login.html'));
});

app.get('/customer-login', (req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(cfg.port, '0.0.0.0', () => {
  console.log('ZummpTrade SaaS running on port ' + cfg.port);
});
