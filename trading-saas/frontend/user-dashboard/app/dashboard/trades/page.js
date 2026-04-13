'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatINR, formatDate } from '@/lib/api';

export default function TradesPage() {
  const router = useRouter();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    const stored = localStorage.getItem('saas_user');
    if (!token) { router.push('/'); return; }
    if (stored) setUser(JSON.parse(stored));
    api('/api/v1/trading/trades?limit=50').then(setTrades).catch(console.error).finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_user');
    router.push('/');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#1e293b', borderRight: '1px solid #334155', padding: '24px 0' }}>
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #334155', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>📈 Trading</div>
        </div>
        {[
          { label: 'Portfolio', href: '/dashboard' },
          { label: 'Trades', href: '/dashboard/trades' },
          { label: 'Signals', href: '/dashboard/signals' },
          { label: 'My Account', href: '/dashboard/account' },
        ].map(item => (
          <a key={item.href} href={item.href} onClick={e => { e.preventDefault(); router.push(item.href); }}
            style={{ display: 'block', padding: '10px 16px', color: item.href === '/dashboard/trades' ? '#3b82f6' : '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/trades' ? 600 : 400, background: item.href === '/dashboard/trades' ? 'rgba(59,130,246,0.1)' : 'transparent', borderLeft: item.href === '/dashboard/trades' ? '3px solid #3b82f6' : '3px solid transparent' }}>
            {item.label}
          </a>
        ))}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', marginTop: 14 }}>
          <button onClick={logout} style={{ width: '100%', padding: '7px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Trade History</h1>

        {loading ? (
          <div style={{ color: '#64748b' }}>Loading...</div>
        ) : trades.length === 0 ? (
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 60, textAlign: 'center', color: '#64748b' }}>
            No trades yet. Bot will execute trades when signals are generated.
          </div>
        ) : (
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Date', 'Symbol', 'Action', 'Qty', 'Price', 'P&L', 'Strategy', 'Confidence'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #334155' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8' }}>{formatDate(t.executed_at)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fff', fontSize: 13 }}>{t.symbol}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: t.action === 'BUY' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: t.action === 'BUY' ? '#86efac' : '#fca5a5' }}>
                        {t.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 13 }}>{t.quantity}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 13 }}>{formatINR(Number(t.price))}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, color: (t.pnl || 0) >= 0 ? '#86efac' : '#fca5a5' }}>
                      {(t.pnl || 0) >= 0 ? '+' : ''}{formatINR(t.pnl)} ({(t.pnl_percent || 0).toFixed(2)}%)
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>{t.strategy || '-'}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 13 }}>{(t.signal_confidence || 0).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
