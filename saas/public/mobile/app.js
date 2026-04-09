// LETESE Mobile PWA App

const API_BASE = window.location.origin;
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || '{}');
let currentPage = 'dashboard';
let deferredPrompt = null;

// ── Service Worker Registration ──────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── Install Prompt ──────────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'flex';
});

function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    document.getElementById('installBanner').style.display = 'none';
  });
}

function dismissInstall() {
  document.getElementById('installBanner').style.display = 'none';
}

// ── Auth ────────────────────────────────────────────────────
function checkAuth() {
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// ── API ─────────────────────────────────────────────────────
async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) { handleLogout(); return null; }
  return res.json().catch(() => ({}));
}

// ── Navigation ──────────────────────────────────────────────
function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('nav-' + page)?.classList.add('active');
  window.scrollTo(0, 0);
  
  if (page === 'dashboard') loadDashboard();
  else if (page === 'trades') loadTrades();
  else if (page === 'alerts') loadAlerts();
  else if (page === 'profile') loadProfile();
}

// ── Dashboard ───────────────────────────────────────────────
async function loadDashboard() {
  const loading = document.getElementById('loading-dashboard');
  if (loading) loading.style.display = 'flex';
  
  const data = await api('/api/customer/portfolio');
  if (!data) return;
  user = data.user || user;
  
  if (loading) loading.style.display = 'none';
  
  const stats = data.stats || {};
  const pnl = parseFloat(stats.totalPnL || 0);
  const pnlPct = pnl > 0 ? '+₹' + pnl.toFixed(0) : (pnl === 0 ? '₹0' : '₹' + pnl.toFixed(0));
  
  // Header
  document.getElementById('headerTitle').textContent = 'Hi, ' + (user.name?.split(' ')[0] || 'User');
  document.getElementById('planBadge').textContent = (user.plan || 'Basic').toUpperCase();
  document.getElementById('planBadge').className = 'badge ' + (user.plan === 'elite' ? 'badge-amber' : 'badge-blue');
  
  // Stats
  document.getElementById('metricPortfolio').textContent = '₹' + (50000 + pnl).toLocaleString('en-IN');
  document.getElementById('metricPnL').textContent = pnlPct;
  document.getElementById('metricPnL').className = 'card-value ' + (pnl >= 0 ? 'pnl-positive' : 'pnl-negative');
  document.getElementById('metricWinRate').textContent = (stats.winRate || 0) + '%';
  document.getElementById('metricWinRate').className = 'card-value ' + ((stats.winRate || 0) >= 50 ? 'pnl-positive' : 'pnl-negative');
  document.getElementById('metricTrades').textContent = (parseInt(stats.wins || 0) + parseInt(stats.losses || 0));
  document.getElementById('metricWins').textContent = stats.wins || 0;
  document.getElementById('metricLosses').textContent = stats.losses || 0;
  
  // Win rate bar
  const wrBar = document.getElementById('wrBar');
  if (wrBar) wrBar.style.width = (stats.winRate || 0) + '%';
  
  // KYC alert
  const kycAlert = document.getElementById('kycAlert');
  if (kycAlert) {
    if (user.kycStatus !== 'approved') {
      kycAlert.style.display = 'flex';
      document.getElementById('kycAlertText').textContent = 
        user.kycStatus === 'pending' ? '⏳ KYC Under Review' : '⚠️ Complete KYC to unlock all features';
    } else {
      kycAlert.style.display = 'none';
    }
  }
  
  // Chart (simple canvas)
  renderEquityCurveSimple(data.performance?.equityCurve || []);
  
  // Recent trades preview
  renderRecentTrades(data.trades || []);
}

// ── Simple Equity Curve (Canvas) ────────────────────────────
function renderEquityCurveSimple(equityCurve) {
  const canvas = document.getElementById('equityCanvas');
  if (!canvas || equityCurve.length < 2) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  
  const values = equityCurve.map(e => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const isProfit = values[values.length - 1] >= values[0];
  const color = isProfit ? '#22c55e' : '#ef4444';
  
  const pw = canvas.offsetWidth / (values.length - 1);
  const ph = canvas.offsetHeight;
  
  ctx.clearRect(0, 0, canvas.offsetWidth, ph);
  
  // Fill area
  ctx.beginPath();
  ctx.moveTo(0, ph);
  values.forEach((v, i) => {
    const x = i * pw;
    const y = ph - ((v - min) / range) * (ph - 20) - 10;
    ctx.lineTo(x, y);
  });
  ctx.lineTo((values.length - 1) * pw, ph);
  ctx.closePath();
  ctx.fillStyle = isProfit ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
  ctx.fill();
  
  // Line
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = i * pw;
    const y = ph - ((v - min) / range) * (ph - 20) - 10;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// ── Recent Trades ────────────────────────────────────────────
function renderRecentTrades(trades) {
  const container = document.getElementById('recentTradesList');
  if (!container) return;
  
  if (!trades.length) {
    container.innerHTML = '<div class="loading" style="min-height:100px;"><span>No trades yet</span></div>';
    return;
  }
  
  container.innerHTML = trades.slice(0, 5).map(t => {
    const pnl = parseFloat(t.pnl || 0);
    const isBuy = (t.action || 'BUY') === 'BUY';
    return `
      <div class="trade-item">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="trade-side trade-side-${isBuy ? 'buy' : 'sell'}"></div>
          <div>
            <div style="font-weight:600;font-size:14px;color:white;">${t.symbol}</div>
            <div style="font-size:11px;color:var(--slate);">${t.strategy || 'Signal'}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="${pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}" style="font-weight:700;font-size:14px;">
            ${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(0)}
          </div>
          <div style="font-size:10px;color:var(--slate);">${isBuy ? 'BUY' : 'SELL'}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Full Trades ──────────────────────────────────────────────
async function loadTrades() {
  const data = await api('/api/customer/portfolio');
  if (!data) return;
  
  const container = document.getElementById('allTradesList');
  if (!container) return;
  
  const trades = data.trades || [];
  if (!trades.length) {
    container.innerHTML = '<div class="loading" style="min-height:200px;"><span>No trades yet</span></div>';
    return;
  }
  
  container.innerHTML = trades.map(t => {
    const pnl = parseFloat(t.pnl || 0);
    const isBuy = (t.action || 'BUY') === 'BUY';
    const date = new Date(t.exitTime || t.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return `
      <div class="trade-item">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="trade-side trade-side-${isBuy ? 'buy' : 'sell'}"></div>
          <div>
            <div style="font-weight:600;font-size:14px;color:white;">${t.symbol}</div>
            <div style="font-size:11px;color:var(--slate);">${date} · ${t.strategy || 'Signal'}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="${pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}" style="font-weight:700;font-size:14px;">
            ${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(0)}
          </div>
          <div style="font-size:10px;color:var(--slate);">Qty: ${t.quantity || '—'}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Alerts / Notifications ───────────────────────────────────
async function loadAlerts() {
  const data = await api('/api/customer/notifications');
  const container = document.getElementById('notifList');
  if (!container) return;
  
  const notifs = data?.notifications || [];
  if (!notifs.length) {
    container.innerHTML = '<div class="loading" style="min-height:200px;"><span>No notifications</span></div>';
    return;
  }
  
  container.innerHTML = notifs.map(n => `
    <div class="notif-item">
      <div>${n.message}</div>
      <div class="notif-time">${new Date(n.createdAt).toLocaleString('en-IN')}</div>
    </div>`).join('');
}

// ── Profile ─────────────────────────────────────────────────
async function loadProfile() {
  const data = await api('/api/customer/portfolio');
  if (!data) return;
  
  user = data.user || user;
  const limits = await api('/api/customer/limits') || {};
  
  document.getElementById('profileName').textContent = user.name || '—';
  document.getElementById('profileEmail').textContent = user.email || '—';
  document.getElementById('profilePhone').textContent = user.phone || '—';
  document.getElementById('profilePlan').textContent = (user.plan || 'basic').toUpperCase();
  document.getElementById('profileKYC').textContent = 
    user.kycStatus === 'approved' ? '✅ Verified' : 
    user.kycStatus === 'pending' ? '⏳ Pending' : '❌ Not Submitted';
  document.getElementById('profileTrades').textContent = data.stats?.totalTrades || 0;
  document.getElementById('profileWinRate').textContent = (data.stats?.winRate || 0) + '%';
  document.getElementById('profilePNL').textContent = 
    (parseFloat(data.stats?.totalPnL || 0) >= 0 ? '+' : '') + '₹' + (data.stats?.totalPnL || 0);
  
  // Features
  const features = limits.features || data.plan?.features || ['30 cases/month'];
  document.getElementById('profileFeatures').innerHTML = features.map(f => 
    `<div class="plan-feature">✓ ${f}</div>`
  ).join('');
}

// ── Pull to Refresh ──────────────────────────────────────────
let touchStartY = 0;
document.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; });
document.addEventListener('touchend', (e) => {
  const delta = touchStartY - e.changedTouches[0].clientY;
  if (delta > 60 && window.scrollY < 50) {
    pullRefresh();
  }
});

function pullRefresh() {
  const indicator = document.getElementById('pullIndicator');
  if (indicator) { indicator.classList.add('show'); indicator.textContent = '↻ Refreshing...'; }
  switchPage(currentPage);
  setTimeout(() => { if (indicator) { indicator.classList.remove('show'); indicator.textContent = '↻ Pull to refresh'; } }, 1000);
}

// ── Init ────────────────────────────────────────────────────
if (checkAuth()) {
  loadDashboard();
}
