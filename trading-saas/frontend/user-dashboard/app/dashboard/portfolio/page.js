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
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function PortfolioPage() {
  const router = useRouter();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { router.push('/'); return; }
    apiCall('/api/trades?limit=50').then(d => {
      if (d?.trades) {
        const open = d.trades.filter(t => t.status === 'open');
        setPositions(open);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui' }}>
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '28px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>📈 NSE-BSE Trading</div>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {SIDEBAR.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: item.href === '/dashboard/portfolio' ? '#60a5fa' : '#9ca3af',
                background: item.href === '/dashboard/portfolio' ? 'rgba(96,165,250,0.1)' : 'transparent',
                borderLeft: item.href === '/dashboard/portfolio' ? '3px solid #60a5fa' : '3px solid transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/portfolio' ? 600 : 500 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: 240, padding: '32px 40px', width: 'calc(100% - 240px)' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>📋 Portfolio</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Your open positions and holdings. Auto-updates when broker is connected.</p>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Open Positions', value: positions.length, color: '#60a5fa' },
            { label: 'Invested Value', value: fmtINR(positions.reduce((s, p) => s + (parseFloat(p.entry_price) * (p.quantity || 1)), 0)), color: '#a78bfa' },
            { label: 'Unrealized P&L', value: fmtINR(positions.reduce((s, p) => s + (parseInt(p.pnl_paise || 0) / 100), 0)), color: '#34d393' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111827', borderRadius: 16, padding: 20, border: '1px solid #1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Positions */}
        <div style={{ background: '#111827', borderRadius: 16, border: '1px solid #1f2937', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Loading...</div>
          ) : positions.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#4b5563', fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <p style={{ fontWeight: 700, color: '#fff', marginBottom: 8 }}>No Open Positions</p>
              <p style={{ marginBottom: 16 }}>Your active trades will appear here once the bot starts trading.</p>
              <button onClick={() => router.push('/dashboard/brokers')}
                style={{ padding: '10px 24px', background: '#1e40ff', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                🔗 Connect Broker to Start Trading
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
                    {['Symbol', 'Action', 'Qty', 'Entry Price', 'Current Price', 'Value', 'P&L', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map(p => {
                    const qty = p.quantity || 1;
                    const entry = parseFloat(p.entry_price) || 0;
                    const val = entry * qty;
                    const pnl = parseInt(p.pnl_paise || 0) / 100;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #1f2937' }}>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.symbol}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: p.action === 'BUY' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: p.action === 'BUY' ? '#34d393' : '#f87171' }}>{p.action}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>{qty}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>{fmtINR(entry)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>—</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#fff', fontFamily: 'monospace' }}>{fmtINR(val)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: pnl >= 0 ? '#34d393' : '#f87171' }}>
                          {pnl >= 0 ? '+' : ''}{fmtINR(Math.abs(pnl))}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', textTransform: 'capitalize' }}>{p.status}</span>
                        </td>
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
