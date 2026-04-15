/**
 * NSE-BSE Trading SaaS — Backend API Server
 * Port: 3021
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3021;

// ── Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/signals', require('./routes/signals'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/broker', require('./routes/broker'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/plans', require('./routes/plans'));

// ── Health ───────────────────────────────────────────────────────
// Root endpoint — info page
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><title>NSE-BSE Trading SaaS API</title></head>
    <body style="font-family:sans-serif;background:#0a0e1a;color:#fff;padding:60px;text-align:center">
    <h1 style="color:#60a5fa">📈 NSE-BSE Trading SaaS</h1>
    <p style="color:#9ca3af">API Server is Running ✅</p>
    <div style="margin:30px auto;max-width:500px;background:#111827;border-radius:16px;padding:30px;text-align:left">
    <h2 style="color:#fff;font-size:18px;margin-bottom:20px">🔗 Quick Links</h2>
    <a href="http://139.59.65.82:3014" style="display:block;padding:12px;background:#1e40ff;color:#fff;text-decoration:none;border-radius:10px;margin-bottom:10px;text-align:center;font-weight:700">📊 User Dashboard →</a>
    <a href="http://139.59.65.82:3013" style="display:block;padding:12px;background:#111827;color:#fff;text-decoration:none;border-radius:10px;margin-bottom:10px;text-align:center;font-weight:700;border:1px solid #374151">🛠 Super Admin →</a>
    <a href="http://139.59.65.82:3016" style="display:block;padding:12px;background:#111827;color:#fff;text-decoration:none;border-radius:10px;text-align:center;font-weight:700;border:1px solid #374151">🏠 Landing Page →</a>
    </div>
    <p style="color:#4b5563;font-size:13px">API Base: http://139.59.65.82:3021</p>
    </body></html>`);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'NSE-BSE Trading SaaS API', timestamp: new Date().toISOString() });
});

app.get('/api/status', (req, res) => {
  res.json({
    name: 'NSE-BSE Trading SaaS',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Error Handler ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 NSE-BSE Trading SaaS API`);
  console.log(`   Port: http://0.0.0.0:${PORT}`);
  console.log(`   Health: http://0.0.0.0:${PORT}/health`);
  console.log(`   Admin:  http://0.0.0.0:${PORT}/api/admin/stats\n`);
});
