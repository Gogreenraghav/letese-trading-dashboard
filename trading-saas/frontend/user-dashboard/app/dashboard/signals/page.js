'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function formatINR(n) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });
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

const STRAT_COLORS = {
  momentum:        { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  mean_reversion:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  breakout:        { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
};

export default function SignalsPage() {
  const router = useRouter();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | buy | sell

  async function loadSignals() {
    const token = localStorage.getItem('user_token');
    if (!token) { router.push('/'); return; }
    try {
      const res = await fetch(`/api/signals?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSignals(data.signals || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { router.push('/'); return; }
    loadSignals();
  }, []);

  const filtered = filter === 'all' ? signals : signals.filter(s => s.action === filter.toUpperCase());

  const stats = {
    total: signals.length,
    buy: signals.filter(s => s.action === 'BUY').length,
    sell: signals.filter(s => s.action === 'SELL').length,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '28px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>📈 NSE-BSE Trading</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Trading Dashboard</div>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {[
            { label: '📊 Dashboard', href: '/dashboard' },
            { label: '📋 My Trades', href: '/dashboard/trades' },
            { label: '📈 Signals', href: '/dashboard/signals' },
            { label: '⚙️ My Account', href: '/dashboard/account' },
          ].map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'block', padding: '10px 16px', color: item.href === '/dashboard/signals' ? '#60a5fa' : '#9ca3af',
                background: item.href === '/dashboard/signals' ? 'rgba(96,165,250,0.1)' : 'transparent',
                borderLeft: item.href === '/dashboard/signals' ? '3px solid #60a5fa' : '3px solid transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/signals' ? 600 : 400 }}>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #1f2937' }}>
          <button onClick={() => { localStorage.removeItem('user_token'); router.push('/'); }}
            style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, padding: '32px 40px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>📈 Trading Signals</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>AI-generated BUY/SELL signals for NSE & BSE stocks</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Signals', value: stats.total, color: '#60a5fa' },
            { label: 'BUY Signals', value: stats.buy, color: '#34d399' },
            { label: 'SELL Signals', value: stats.sell, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111827', borderRadius: 16, padding: 20, border: '1px solid #1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['all','buy','sell'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: filter === f ? '#2563eb' : '#1f2937', color: '#fff' }}>
              {f === 'all' ? 'All' : f === 'buy' ? '📈 BUY' : '📉 SELL'}
            </button>
          ))}
          <button onClick={loadSignals} style={{ marginLeft: 'auto', padding: '7px 16px', background: '#1f2937', border: '1px solid #374151', borderRadius: 10, color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>

        {/* Signals Table */}
        <div style={{ background: '#111827', borderRadius: 16, border: '1px solid #1f2937', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Loading signals...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#4b5563', fontSize: 14 }}>
              📭 No signals found. Bot generates signals every 2 minutes.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
                    {['Symbol','Action','Entry Price','Target','Stop Loss','Confidence','Strategy','Exchange','Time'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sig => {
                    const sc = STRAT_COLORS[sig.strategy] || STRAT_COLORS.momentum;
                    return (
                      <tr key={sig.id} style={{ borderBottom: '1px solid #1f2937', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{sig.symbol}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                            background: sig.action === 'BUY' ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
                            color: sig.action === 'BUY' ? '#34d399' : '#f87171' }}>
                            {sig.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>
                          {sig.entry_price ? formatINR(parseFloat(sig.entry_price)) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#34d399', fontFamily: 'monospace' }}>
                          {sig.target_price ? formatINR(parseFloat(sig.target_price)) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#f87171', fontFamily: 'monospace' }}>
                          {sig.stop_loss ? formatINR(parseFloat(sig.stop_loss)) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                            background: parseFloat(sig.confidence) > 70 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                            color: parseFloat(sig.confidence) > 70 ? '#34d399' : '#fbbf24' }}>
                            {sig.confidence ? sig.confidence + '%' : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                            {sig.strategy || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{sig.exchange || 'NSE'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#4b5563', whiteSpace: 'nowrap' }}>{timeAgo(sig.created_at)}</td>
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
