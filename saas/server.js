/**
 * LETESE Trading SaaS Platform
 * Super Admin + Customer Dashboard Server
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const http = require('http');
const axios = require('axios');

// Redis client
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;

async function initRedis() {
  try {
    redisClient = redis.createClient({ url: REDIS_URL, legacyMode: false });
    redisClient.on('error', () => {});
    redisClient.on('connect', () => console.log('✅ Redis connected'));
    await redisClient.connect();
  } catch (e) {
    console.log('⚠️ Redis not available, using memory cache');
    redisClient = null;
  }
}

async function cacheGet(key) {
  if (!redisClient) return null;
  try {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  } catch (e) { return null; }
}

async function cacheSet(key, value, ttl = 300) {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (e) {}
}

const app = express();
const PORT = 3010;
const JWT_SECRET = process.env.JWT_SECRET || 'letese-saas-secret-2026';
const SALT_ROUNDS = 10;

// ── JSON File Database (lowdb-style) ───────────────────────────
const DB_FILE = path.join(__dirname, 'db.json');

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: [], portfolios: [], trades: [], settings: {}, activities: [] };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getDB() {
  return loadDB();
}

// Initialize DB
if (!fs.existsSync(DB_FILE)) {
  saveDB({
    users: [],
    portfolios: [],
    trades: [],
    settings: {},
    activities: [],
    notifications: [],
    kyc_requests: [],
    plans: [
      { id: 'basic', name: 'Basic', price: 999, features: ['30 cases/month', 'Basic dashboard', 'Email support'], tradeLimit: 10, apiAccess: false },
      { id: 'professional', name: 'Professional', price: 2499, features: ['100 cases/month', 'Full dashboard', 'Telegram alerts', 'Backtesting'], tradeLimit: 50, apiAccess: true },
      { id: 'elite', name: 'Elite', price: 4999, features: ['Unlimited cases', 'AI drafting', 'All features', 'Priority support'], tradeLimit: -1, apiAccess: true },
    ],
  });
}

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static SaaS frontend
app.use(express.static(path.join(__dirname, 'public')));

// ── Auth Middleware ─────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ── Admin Setup (run once) ──────────────────────────────────────
function setupAdmin() {
  const db = getDB();
  if (!db.users.find(u => u.role === 'admin')) {
    const hashed = bcrypt.hashSync('admin123', SALT_ROUNDS);
    db.users.push({
      id: uuidv4(),
      name: 'Super Admin',
      email: 'admin@letese.com',
      phone: '+91-9876543210',
      password: hashed,
      role: 'admin',
      plan: 'elite',
      kycStatus: 'approved',
      createdAt: new Date().toISOString(),
      lastLogin: null,
    });
    saveDB(db);
    console.log('✅ Super Admin created: admin@letese.com / admin123');
  }
}
setupAdmin();

// ── AUTH ROUTES ────────────────────────────────────────────────

// Register (Customer)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, plan } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const db = getDB();
    
    if (db.users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = {
      id: uuidv4(),
      name,
      email,
      phone,
      password: hashed,
      role: 'customer',
      plan: plan || 'basic',
      kycStatus: 'pending',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      profile: { address: '', city: '', state: '', pincode: '', pan: '', aadhaar: '' },
      stats: { totalTrades: 0, totalPnL: 0, winRate: 0 },
    };
    db.users.push(user);
    saveDB(db);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const db = getDB();
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Update last login
    user.lastLogin = new Date().toISOString();
    saveDB(db);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get current user
app.get('/api/auth/me', requireAuth, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: sanitizeUser(user) });
});

// ── CUSTOMER ROUTES ────────────────────────────────────────────

// Get customer portfolio
app.get('/api/customer/portfolio', requireAuth, (req, res) => {
  const db = getDB();
  const userId = req.user.id;
  const portfolio = db.portfolios.filter(p => p.userId === userId);
  const trades = db.trades.filter(t => t.userId === userId);
  const user = db.users.find(u => u.id === userId);
  
  // Generate sample data if empty (for demo)
  if (trades.length === 0) {
    const sampleTrades = generateSampleTrades(userId);
    db.trades.push(...sampleTrades);
    saveDB(db);
  }

  const allTrades = db.trades.filter(t => t.userId === userId);
  res.json({
    user: sanitizeUser(user),
    portfolio: db.portfolios.filter(p => p.userId === userId),
    trades: allTrades,
    stats: calculateStats(allTrades),
    plan: db.plans.find(p => p.id === (user?.plan || 'basic')),
  });
});

// Get customer performance
app.get('/api/customer/performance', requireAuth, (req, res) => {
  const db = getDB();
  const trades = db.trades.filter(t => t.userId === req.user.id);
  if (trades.length === 0) {
    return res.json({ error: 'No trades yet', summary: getEmptyStats() });
  }
  res.json(calculatePerformance(trades));
});

// ── ADMIN ROUTES ───────────────────────────────────────────────

// Get all customers (admin only)
app.get('/api/admin/customers', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const customers = db.users
    .filter(u => u.role === 'customer')
    .map(u => {
      const trades = db.trades.filter(t => t.userId === u.id);
      return {
        ...sanitizeUser(u),
        stats: calculateStats(trades),
        tradeCount: trades.length,
        plans: db.plans,
      };
    });
  res.json({ customers, total: customers.length });
});

// Get single customer detail
app.get('/api/admin/customers/:id', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.params.id && u.role === 'customer');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  
  const trades = db.trades.filter(t => t.userId === user.id);
  const portfolios = db.portfolios.filter(p => p.userId === user.id);
  
  res.json({
    user: sanitizeUser(user),
    trades,
    portfolios,
    stats: calculateStats(trades),
    performance: calculatePerformance(trades),
    activities: db.activities.filter(a => a.userId === user.id).slice(-20).reverse(),
    plans: db.plans,
  });
});

// Approve/Reject KYC
app.post('/api/admin/kyc/:id', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.params.id && u.role === 'customer');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  
  const { status } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  user.kycStatus = status;
  user.kycUpdatedAt = new Date().toISOString();
  saveDB(db);
  
  // Log activity
  db.activities.push({
    id: uuidv4(),
    userId: user.id,
    type: 'KYC_UPDATE',
    message: `KYC ${status} for ${user.name} (${user.email})`,
    adminId: req.user.id,
    createdAt: new Date().toISOString(),
  });
  saveDB(db);
  
  res.json({ success: true, kycStatus: status });
});

// Update customer plan
app.post('/api/admin/plan/:id', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.params.id && u.role === 'customer');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  
  const { plan } = req.body;
  const validPlans = db.plans.map(p => p.id);
  if (!validPlans.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
  
  user.plan = plan;
  saveDB(db);
  
  db.activities.push({
    id: uuidv4(),
    userId: user.id,
    type: 'PLAN_CHANGE',
    message: `Plan changed to ${plan} for ${user.name}`,
    adminId: req.user.id,
    createdAt: new Date().toISOString(),
  });
  saveDB(db);
  
  res.json({ success: true, plan });
});

// Admin analytics overview
app.get('/api/admin/overview', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const customers = db.users.filter(u => u.role === 'customer');
  const allTrades = db.trades;
  
  const totalPnL = allTrades.reduce((a, t) => a + (t.pnl || 0), 0);
  const wins = allTrades.filter(t => t.pnl > 0).length;
  const winRate = allTrades.length > 0 ? (wins / allTrades.length * 100).toFixed(1) : 0;
  const kycPending = customers.filter(u => u.kycStatus === 'pending').length;
  
  // Revenue by plan
  const revenue = customers.reduce((acc, u) => {
    const plan = db.plans.find(p => p.id === u.plan);
    return acc + (plan?.price || 0);
  }, 0);

  // Recent registrations
  const recentCustomers = customers
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(sanitizeUser);

  // Plan distribution
  const planDist = {};
  customers.forEach(u => { planDist[u.plan] = (planDist[u.plan] || 0) + 1; });

  res.json({
    totalCustomers: customers.length,
    activeCustomers: customers.filter(u => u.kycStatus === 'approved').length,
    kycPending,
    totalTrades: allTrades.length,
    totalPnL: totalPnL.toFixed(2),
    winRate,
    monthlyRevenue: revenue,
    planDistribution: planDist,
    recentRegistrations: recentCustomers,
  });
});

// Get all plans (with Redis caching)
app.get('/api/plans', (req, res) => {
  cacheGet('plans').then(cached => {
    if (cached) return res.json({ plans: cached });
    const db = getDB();
    cacheSet('plans', db.plans, 3600);
    res.json({ plans: db.plans });
  });
});

// ── User KYC Update ──────────────────────────────────────────
app.post('/api/customer/kyc', requireAuth, (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customer only' });
  const db = getDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { pan, aadhaar, address, city, state, pincode, occupation, incomeRange } = req.body;
  user.profile = {
    ...user.profile,
    pan: pan || user.profile?.pan,
    aadhaar: aadhaar || user.profile?.aadhaar,
    address: address || user.profile?.address,
    city: city || user.profile?.city,
    state: state || user.profile?.state,
    pincode: pincode || user.profile?.pincode,
    occupation: occupation || user.profile?.occupation,
    incomeRange: incomeRange || user.profile?.incomeRange,
    kycSubmittedAt: new Date().toISOString(),
  };
  if (user.kycStatus === 'pending') {
    user.kycStatus = 'pending';
  }
  saveDB(db);
  res.json({ success: true, message: 'KYC details saved' });
});

// ── WhatsApp Notifications ────────────────────────────────────
app.post('/api/notifications/whatsapp', (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'Phone and message required' });

  const WA_API_URL = process.env.WA_API_URL || '';
  const WA_TOKEN = process.env.WA_TOKEN || '';

  if (WA_API_URL && WA_TOKEN) {
    axios.post(WA_API_URL, {
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'text',
      text: { body: message },
    }, {
      headers: { 'Authorization': `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      timeout: 10000,
    }).then(() => res.json({ success: true, sent: true }))
      .catch(e => res.status(500).json({ error: e.message, sent: false }));
  } else {
    console.log(`📱 WhatsApp [DEMO] → ${phone}: ${message}`);
    res.json({ success: true, sent: false, demo: true, message: 'WhatsApp API not configured. Set WA_API_URL and WA_TOKEN in .env' });
  }
});

// ── Customer Notifications ────────────────────────────────────
app.get('/api/customer/notifications', requireAuth, (req, res) => {
  const db = getDB();
  const notifications = db.notifications || [];
  const userNotifs = notifications.filter(n => n.userId === req.user.id).slice(-30).reverse();
  res.json({ notifications: userNotifs });
});

// ── Admin: Send notification to customer ─────────────────────
app.post('/api/admin/notify/:id', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { message, type } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  if (!db.notifications) db.notifications = [];
  db.notifications.push({
    id: uuidv4(),
    userId: user.id,
    message,
    type: type || 'admin',
    read: false,
    createdAt: new Date().toISOString(),
  });
  saveDB(db);

  if (user.phone) {
    const notifText = `🔔 LETESE: ${message}`;
    axios.post('http://localhost:' + PORT + '/api/notifications/whatsapp', {
      phone: user.phone,
      message: notifText,
    }).catch(() => {});
  }

  res.json({ success: true });
});

// ── Admin: Activity Log ───────────────────────────────────────
app.get('/api/admin/activities', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const activities = (db.activities || []).slice(-50).reverse();
  res.json({ activities });
});

// ── Admin: Update user limits ─────────────────────────────────
app.post('/api/admin/limits/:id', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { tradeLimit, apiAccess, features } = req.body;
  if (tradeLimit !== undefined) user.tradeLimit = parseInt(tradeLimit);
  if (apiAccess !== undefined) user.apiAccess = apiAccess;
  if (features) user.features = features;
  saveDB(db);
  res.json({ success: true });
});

// ── Customer: Get limits ──────────────────────────────────────
app.get('/api/customer/limits', requireAuth, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const plan = db.plans.find(p => p.id === (user.plan || 'basic')) || {};
  res.json({
    tradeLimit: user.tradeLimit || plan.tradeLimit || 10,
    apiAccess: user.apiAccess || plan.apiAccess || false,
    features: user.features || plan.features || [],
    plan: user.plan,
  });
});

// ── Broker Connection ────────────────────────────────────────
app.post('/api/customer/broker', requireAuth, (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customer only' });
  const db = getDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { broker, apiKey, connected } = req.body;
  user.brokerConfig = { broker, apiKey: apiKey ? '****' + apiKey.slice(-4) : '', connected: connected || false };
  user.brokerConnectedAt = connected ? new Date().toISOString() : null;
  saveDB(db);
  res.json({ success: true });
});

app.get('/api/customer/broker', requireAuth, (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ config: user.brokerConfig || null });
});

// ── Admin: Delete customer ───────────────────────────────────
app.delete('/api/admin/customers/:id', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const idx = db.users.findIndex(u => u.id === req.params.id && u.role === 'customer');
  if (idx < 0) return res.status(404).json({ error: 'Customer not found' });
  db.users.splice(idx, 1);
  saveDB(db);
  res.json({ success: true });
});

// ── HELPERS ────────────────────────────────────────────────────

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function calculateStats(trades) {
  if (!trades || trades.length === 0) {
    return getEmptyStats();
  }
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length * 100).toFixed(1) : 0;
  const totalPnL = trades.reduce((a, t) => a + (t.pnl || 0), 0);
  
  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    totalPnL: totalPnL.toFixed(2),
    avgWin: wins.length > 0 ? (wins.reduce((a, t) => a + t.pnl, 0) / wins.length).toFixed(2) : '0.00',
    avgLoss: losses.length > 0 ? Math.abs(losses.reduce((a, t) => a + t.pnl, 0) / losses.length).toFixed(2) : '0.00',
    bestTrade: wins.length > 0 ? Math.max(...wins.map(t => t.pnl)).toFixed(2) : '0.00',
    worstTrade: losses.length > 0 ? Math.min(...losses.map(t => t.pnl)).toFixed(2) : '0.00',
  };
}

function getEmptyStats() {
  return { totalTrades: 0, wins: 0, losses: 0, winRate: '0.0', totalPnL: '0.00', avgWin: '0.00', avgLoss: '0.00', bestTrade: '0.00', worstTrade: '0.00' };
}

function calculatePerformance(trades) {
  if (!trades || trades.length === 0) {
    return { summary: getEmptyStats(), equityCurve: [{ day: 0, value: 50000 }], monthlyPnL: [] };
  }
  
  let portfolio = 50000;
  const equityCurve = [{ day: 0, value: portfolio }];
  
  trades.slice().sort((a, b) => new Date(a.exitTime || a.timestamp) - new Date(b.exitTime || b.timestamp))
    .forEach((t, i) => {
      portfolio += t.pnl || 0;
      equityCurve.push({ day: i + 1, value: Math.round(portfolio) });
    });

  // Monthly P&L
  const monthlyPnL = {};
  trades.forEach(t => {
    const d = new Date(t.exitTime || t.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyPnL[key]) monthlyPnL[key] = { month: key, pnl: 0, trades: 0 };
    monthlyPnL[key].pnl += t.pnl || 0;
    monthlyPnL[key].trades++;
  });

  return {
    summary: calculateStats(trades),
    equityCurve,
    monthlyPnL: Object.values(monthlyPnL).sort((a, b) => a.month.localeCompare(b.month)),
  };
}

function generateSampleTrades(userId) {
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'NIFTY', 'BANKNIFTY'];
  const strategies = ['Breakout', 'RSI Reversal', 'Volume Spike', 'Moving Average', 'Support Resistance'];
  const trades = [];
  
  for (let i = 0; i < 25; i++) {
    const pnl = (Math.random() - 0.35) * 5000;
    const date = new Date();
    date.setDate(date.getDate() - (25 - i));
    trades.push({
      id: uuidv4(),
      userId,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      action: pnl > 0 ? 'BUY' : 'SELL',
      quantity: Math.floor(Math.random() * 100) + 10,
      entryPrice: 1500 + Math.random() * 3000,
      exitPrice: 0,
      pnl: parseFloat(pnl.toFixed(2)),
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      quality: pnl > 0 ? 'PROFIT' : 'LOSS',
      reason: 'Signal triggered',
      entryTime: new Date(date).toISOString(),
      exitTime: new Date(date.getTime() + 3600000 * Math.random() * 48).toISOString(),
      confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
    });
  }
  return trades;
}

// ── SERVE FRONTEND PAGES ────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.get('/customer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/customer.html'));
});

app.get('/broker-setup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/broker-setup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/register.html'));
});

// Redirect root to login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// ── START ───────────────────────────────────────────────────────
initRedis().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🏛️  LETESE SaaS Platform`);
    console.log(`   Admin:   http://139.59.65.82:3010/admin`);
    console.log(`   Login:   http://139.59.65.82:3010/login`);
    console.log(`   Register: http://139.59.65.82:3010/register`);
    console.log(`   Customer: http://139.59.65.82:3010/customer`);
    console.log(`\n   Admin credentials: admin@letese.com / admin123\n`);
  });
});
