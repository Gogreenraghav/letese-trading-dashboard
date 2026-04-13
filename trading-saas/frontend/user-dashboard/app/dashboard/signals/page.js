'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatDate } from '@/lib/api';

export default function SignalsPage() {
  const router = useRouter();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    api('/api/v1/trading/signals?limit=50').then(setSignals).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
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
            style={{ display: 'block', padding: '10px 16px', color: item.href === '/dashboard/signals' ? '#3b82f6' : '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/signals' ? 600 : 400, background: item.href === '/dashboard/signals' ? 'rgba(59,130,246,0.1)' : 'transparent', borderLeft: item.href === '/dashboard/signals' ? '3px solid #3b82f6' : '3px solid transparent' }}>
            {item.label}
          </a>
        ))}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', marginTop: 14 }}>
          <button onClick={() => { localStorage.removeItem('saas_token'); router.push('/'); }} style={{ width: '100%', padding: '7px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Trading Signals</h1>

        {loading ? <div style={{ color: '#64748b' }}>Loading...</div> : signals.length === 0 ? (
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 60, textAlign: 'center', color: '#64748b' }}>
            No signals yet. Bot scans 49 NSE stocks every 30 seconds.
          </div>
        ) : (
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Date', 'Symbol', 'Action', 'Confidence', 'Strategy', 'Price', 'Stop Loss', 'Target', 'Executed'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #334155' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signals.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8' }}>{formatDate(s.created_at)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fff', fontSize: 13 }}>{s.symbol}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: s.action === 'BUY' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: s.action === 'BUY' ? '#86efac' : '#fca5a5' }}>{s.action}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#334155', borderRadius: 3 }}>
                          <div style={{ width: `${(s.confidence || 0) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 32 }}>{(s.confidence || 0).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8' }}>{s.strategy || '-'}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 13 }}>{s.price ? '₹' + Number(s.price).toLocaleString('en-IN') : '-'}</td>
                    <td style={{ padding: '10px 14px', color: '#fca5a5', fontSize: 13 }}>{s.stop_loss ? '₹' + Number(s.stop_loss).toLocaleString('en-IN') : '-'}</td>
                    <td style={{ padding: '10px 14px', color: '#86efac', fontSize: 13 }}>{s.target ? '₹' + Number(s.target).toLocaleString('en-IN') : '-'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, background: s.executed ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.2)', color: s.executed ? '#86efac' : '#94a3b8' }}>
                        {s.executed ? '✅ Yes' : '⏳ Pending'}
                      </span>
                    </td>
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
