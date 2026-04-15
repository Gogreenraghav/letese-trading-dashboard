'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';
const SIDEBAR = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '📈', label: 'Signals', href: '/dashboard/signals' },
  { icon: '💰', label: 'My Trades', href: '/dashboard/trades' },
  { icon: '📋', label: 'Portfolio', href: '/dashboard/portfolio' },
  { icon: '⭐', label: 'Watchlist', href: '/dashboard/watchlist' },
  { icon: '🪙', label: 'Credits', href: '/dashboard/credits' },
  { icon: '🔗', label: 'Broker API', href: '/dashboard/brokers' },
  { icon: '⚙️', label: 'Settings', href: '/dashboard/account' },
];

async function apiCall(endpoint) {
  const token = localStorage.getItem('user_token');
  const res = await fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) { window.location.href = '/'; return null; }
  return res.json();
}

function fmtINR(n) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });
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

export default function TradesPage() {
  const router = useRouter();
  const [data, setData] = useState({ trades: [], stats: {} });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { router.push('/'); return; }
    apiCall('/api/trades?limit=50').then(d => { if (d) setData(d); setLoading(false); });
  }, []);

  const filtered = filter === 'all' ? data.trades : data.trades.filter(t => t.status === filter);
  const stats = data.stats || {};

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui' }}>
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '28px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>📈 NSE-BSE Trading</div>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {SIDEBAR.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: item.href === '/dashboard/trades' ? '#60a5fa' : '#9ca3af',
                background: item.href === '/dashboard/trades' ? 'rgba(96,165,250,0.1)' : 'transparent',
                borderLeft: item.href === '/dashboard/trades' ? '3px solid #60a5fa' : '3px solid transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/trades' ? 600 : 500 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: 240, padding: '32px 40px', width: 'calc(100% - 240px)' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>💰 My Trades</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Complete trading history with profit/loss tracking</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Trades', value: stats.total_trades || 0, color: '#60a5fa' },
            { label: 'Profitable', value: stats.profitable_trades || 0, color: '#34d393' },
            { label: 'Win Rate', value: (stats.win_rate || 0) + '%', color: (stats.win_rate || 0) > 50 ? '#34d393' : '#f87171' },
            { label: 'Total P&L', value: fmtINR(stats.total_pnl || 0), color: parseFloat(stats.total_pnl || 0) >= 0 ? '#34d393' : '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111827', borderRadius: 16, padding: 18, border: '1px solid #1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['all', 'open', 'closed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: filter === f ? '#2563eb' : '#1f2937', color: '#fff' }}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#111827', borderRadius: 16, border: '1px solid #1f2937', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#4b5563', fontSize: 14 }}>
              📭 No trades yet. Connect your broker API to start auto-trading.
              <br />
              <button onClick={() => router.push('/dashboard/brokers')} style={{ marginTop: 12, padding: '8px 20px', background: '#1e40ff', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                🔗 Connect Broker →
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
                    {['Symbol', 'Action', 'Qty', 'Entry', 'Exit', 'P&L', 'Status', 'Broker ID', 'Time'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(trade => {
                    const pnl = trade.pnl_paise ? parseInt(trade.pnl_paise) / 100 : null;
                    return (
                      <tr key={trade.id} style={{ borderBottom: '1px solid #1f2937', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#fff' }}>{trade.symbol}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: trade.action === 'BUY' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: trade.action === 'BUY' ? '#34d393' : '#f87171' }}>{trade.action}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>{trade.quantity || 1}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>{trade.entry_price ? fmtINR(trade.entry_price) : '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>{trade.exit_price ? fmtINR(trade.exit_price) : '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: pnl === null ? '#6b7280' : pnl >= 0 ? '#34d393' : '#f87171' }}>
                          {pnl === null ? 'Open' : (pnl >= 0 ? '+' : '') + fmtINR(Math.abs(pnl))}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: trade.status === 'closed' ? 'rgba(52,211,153,0.15)' : trade.status === 'open' ? 'rgba(96,165,250,0.15)' : 'rgba(251,191,36,0.15)', color: trade.status === 'closed' ? '#34d393' : trade.status === 'open' ? '#60a5fa' : '#fbbf24', textTransform: 'capitalize' }}>
                            {trade.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: '#4b5563', fontFamily: 'monospace' }}>{trade.broker_order_id || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#4b5563', whiteSpace: 'nowrap' }}>{timeAgo(trade.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
