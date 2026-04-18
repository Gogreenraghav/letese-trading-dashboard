const jwt = require('jsonwebtoken');
const cfg = require('../config');
const path = require('path');
const fs = require('fs');

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, cfg.jwtSecret);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// Serve HTML pages only if authenticated (for protected routes)
function serveProtectedPage(pageFile) {
  return (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.redirect('/login.html');
    try {
      const decoded = jwt.verify(token, cfg.jwtSecret);
      const file = path.join(__dirname, '../../public', pageFile);
      if (fs.existsSync(file)) {
        res.sendFile(file);
      } else {
        res.status(404).send('Not found');
      }
    } catch {
      res.redirect('/login.html');
    }
  };
}

// Check auth and role for protected pages
function serveAdminPage(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.redirect('/login.html');
  try {
    const decoded = jwt.verify(token, cfg.jwtSecret);
    if (decoded.role !== 'admin') return res.redirect('/dashboard.html');
    const file = path.join(__dirname, '../../public/admin.html');
    res.sendFile(file);
  } catch {
    res.redirect('/login.html');
  }
}

module.exports = { auth, adminOnly, serveProtectedPage, serveAdminPage };
