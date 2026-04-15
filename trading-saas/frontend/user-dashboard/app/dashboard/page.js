'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';

async function apiCall(endpoint) {
  const token = localStorage.getItem('user_token');
  const res = await fetch(`${API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (res.status === 401) { window.location.href = '/'; return null; }
  return res.json();
}

function fmtINR(n) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtPaise(p) {
  if (p == null) return '₹0';
  const rupees = parseInt(p) / 100;
  return (rupees >= 0 ? '+' : '') + '₹' + Math.abs(rupees).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SIDEBAR = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '📈', label: 'Signals', href: '/dashboard/signals' },
  { icon: '💰', label: 'My Trades', href: '/dashboard/trades' },
  { icon: '📋', label: 'Portfolio', href: '/dashboard/portfolio' },
  { icon: '⭐', label: 'Watchlist', href: '/dashboard/watchlist' },
  { icon: '🪙', label: 'Credits', href: '/dashboard/credits' },
  { icon: '🔗', label: 'Broker API', href: '/dashboard/brokers' },
  { icon: '📋', label: 'Plans', href: '/dashboard/plans' },
  { icon: '⚙️', label: 'Settings', href: '/dashboard/account' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState({ balance: 0, total_spent: 0 });
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState({ total: 0, buy: 0, sell: 0, last24h: 0 });
  const [trades, setTrades] = useState([]);
  const [tradeStats, setTradeStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { router.push('/'); return; }

    async function load() {
      const [me, wallet, sigData, tradeData] = await Promise.all([
        apiCall('/api/auth/me'),
        apiCall('/api/credits/wallet'),
        apiCall('/api/signals?limit=10'),
        apiCall('/api/trades?limit=5'),
      ]);

      if (!me) return;
      setUser(me.user || me);
      if (wallet && !wallet.error) setCredits(wallet);
      if (sigData?.signals) {
        setSignals(sigData.signals);
        setStats({
          total: sigData.total || sigData.signals.length,
          buy: sigData.signals.filter(s => s.action === 'BUY').length,
          sell: sigData.signals.filter(s => s.action === 'SELL').length,
          last24h: sigData.signals.filter(s => {
            if (!s.created_at) return false;
            return Date.now() - new Date(s.created_at).getTime() < 86400000;
          }).length,
        });
      }
      if (tradeData?.trades) {
        setTrades(tradeData.trades);
        setTradeStats(tradeData.stats || {});
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    router.push('/');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0e1a', color: '#60a5fa', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
        <div style={{ fontSize: 18 }}>Loading your dashboard...</div>
      </div>
    </div>
  );

  const pnl = parseFloat(tradeStats.total_pnl || 0);
  const pnlColor = pnl >= 0 ? '#34d393' : '#f87171';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '28px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 2 }}>📈 NSE-BSE Trading</div>
          <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>AI-Powered Trading Platform</div>
        </div>

        <nav style={{ padding: '12px 0' }}>
          {SIDEBAR.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#9ca3af',
                textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                borderLeft: '3px solid transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #1f2937', marginTop: 'auto' }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            Logged in as<br />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{user?.full_name || user?.email || 'User'}</span>
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, padding: '32px 40px', minHeight: '100vh', width: 'calc(100% - 240px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
              Dashboard
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Welcome back, {user?.full_name || user?.email} ·{' '}
              <span style={{ color: '#60a5fa', fontWeight: 700, textTransform: 'capitalize' }}>{user?.plan || 'Free'}</span>
              {user?.plan_info?.plan_mode && (
                <span style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: user.plan_info.auto_trade_enabled ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.15)', color: user.plan_info.auto_trade_enabled ? '#34d393' : '#60a5fa' }}>
                  {user.plan_info.mode_label}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Balance</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: credits.balance < 10 ? '#f87171' : '#34d393', fontFamily: 'monospace' }}>₹{credits.balance}</div>
              <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>{credits.balance} credits</div>
            </div>
            <button onClick={() => router.push('/dashboard/credits')}
              style={{ background: '#1e40ff', border: 'none', borderRadius: 12, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              🪙 Top-Up
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Signals', value: stats.total, color: '#60a5fa', icon: '📈' },
            { label: 'BUY Signals', value: stats.buy, color: '#34d393', icon: '🟢' },
            { label: 'SELL Signals', value: stats.sell, color: '#f87171', icon: '🔴' },
            { label: 'Last 24 Hours', value: stats.last24h, color: '#a78bfa', icon: '⏰' },
            { label: 'Total Trades', value: tradeStats.total_trades || 0, color: '#fbbf24', icon: '📋' },
            { label: 'Win Rate', value: (tradeStats.win_rate || 0) + '%', color: tradeStats.win_rate > 50 ? '#34d393' : '#f87171', icon: '🎯' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111827', borderRadius: 16, padding: 18, border: '1px solid #1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* P&L + Broker */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* P&L Card */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>💰 Trading P&L</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: 16, background: '#0f172a', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Total P&L</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: pnlColor, fontFamily: 'monospace' }}>{fmtPaise(tradeStats.total_pnl_paise)}</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: '#0f172a', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Profit</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#34d393', fontFamily: 'monospace' }}>+{fmtINR(tradeStats.total_profit || 0)}</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: '#0f172a', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Loss</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#f87171', fontFamily: 'monospace' }}>-{fmtINR(tradeStats.total_loss || 0)}</div>
              </div>
            </div>
            <button onClick={() => router.push('/dashboard/trades')}
              style={{ marginTop: 16, width: '100%', padding: '10px', background: '#1f2937', border: '1px solid #374151', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              📋 View All Trades →
            </button>
          </div>

          {/* Broker Status */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>🔗 Broker Connection</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Zerodha Kite', status: 'Not Connected', color: '#6b7280', icon: '⚪' },
                { name: 'Samco', status: 'Not Connected', color: '#6b7280', icon: '⚪' },
                { name: 'ICICI Direct', status: 'Coming Soon', color: '#6b7280', icon: '⏳' },
              ].map(b => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0f172a', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{b.icon}</span>
                    <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{b.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: b.color, fontWeight: 600 }}>{b.status}</span>
                </div>
              ))}
              <button onClick={() => router.push('/dashboard/brokers')}
                style={{ marginTop: 4, width: '100%', padding: '10px', background: '#1e40ff', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Connect Broker API
              </button>
            </div>
          </div>
        </div>

        {/* Recent Signals */}
        <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>📈 Recent Signals</h3>
            <button onClick={() => router.push('/dashboard/signals')}
              style={{ background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#60a5fa', fontSize: 12, fontWeight: 600, padding: '6px 14px', cursor: 'pointer' }}>
              View All →
            </button>
          </div>
          {signals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#4b5563', fontSize: 14 }}>📭 No signals yet. Bot generates signals every minute.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f2937' }}>
                    {['Symbol', 'Action', 'Entry Price', 'Target', 'Stop Loss', 'Confidence', 'Strategy', 'Time'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {signals.slice(0, 8).map(sig => (
                    <tr key={sig.id} style={{ borderBottom: '1px solid #1f2937', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#fff' }}>{sig.symbol}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: sig.action === 'BUY' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: sig.action === 'BUY' ? '#34d393' : '#f87171' }}>{sig.action}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>{sig.entry_price ? fmtINR(parseFloat(sig.entry_price)) : '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#34d393', fontFamily: 'monospace' }}>{sig.target_price ? fmtINR(parseFloat(sig.target_price)) : '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#f87171', fontFamily: 'monospace' }}>{sig.stop_loss ? fmtINR(parseFloat(sig.stop_loss)) : '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: parseFloat(sig.confidence) > 70 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: parseFloat(sig.confidence) > 70 ? '#34d393' : '#fbbf24' }}>
                          {sig.confidence}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{(sig.strategy || 'momentum').replace('_', ' ')}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#4b5563', whiteSpace: 'nowrap' }}>{timeAgo(sig.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
