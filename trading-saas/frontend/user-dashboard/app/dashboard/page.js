'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatINR, formatDate } from '@/lib/api';

const NAV = [
  { label: 'Portfolio', href: '/dashboard' },
  { label: 'Trades', href: '/dashboard/trades' },
  { label: 'Signals', href: '/dashboard/signals' },
  { label: 'My Account', href: '/dashboard/account' },
];

function Sidebar({ user, plan, onLogout, activeHref, router }) {
  return (
    <aside style={{ width: 220, background: '#1e293b', borderRight: '1px solid #334155', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #334155', marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>📈 Trading</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>My Portfolio</div>
      </div>
      <nav style={{ flex: 1 }}>
        {NAV.map(item => (
          <a key={item.href} href={item.href}
            onClick={e => { e.preventDefault(); router.push(item.href); }}
            style={{
              display: 'block', padding: '10px 16px', color: activeHref === item.href ? '#3b82f6' : '#94a3b8',
              textDecoration: 'none', fontSize: 13, fontWeight: activeHref === item.href ? 600 : 400,
              background: activeHref === item.href ? 'rgba(59,130,246,0.1)' : 'transparent',
              borderLeft: activeHref === item.href ? '3px solid #3b82f6' : '3px solid transparent',
            }}>
            {item.label}
          </a>
        ))}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #334155' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{user?.full_name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{user?.email}</div>
          <div style={{ marginTop: 4, display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>
            {plan?.toUpperCase()}
          </div>
        </div>
        <button onClick={onLogout} style={{ width: '100%', padding: '7px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </aside>
  );
}

function StatCard({ icon, value, label, color = '#fff' }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 18, border: '1px solid #334155' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    const stored = localStorage.getItem('saas_user');
    if (!token) { router.push('/'); return; }
    if (stored) setUser(JSON.parse(stored));
    Promise.all([api('/api/v1/trading/portfolio'), api('/api/v1/trading/stats')]).then(([p, s]) => {
      setPortfolio(p);
      setStats(s);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_user');
    router.push('/');
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
      Loading portfolio...
    </div>
  );

  const positions = portfolio?.positions || [];
  const invested = positions.reduce((sum, p) => sum + (p.quantity * Number(p.entry_price)), 0);
  const capital = portfolio?.capital || 1000000;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      <Sidebar user={user} plan={user?.plan} onLogout={logout} activeHref="/dashboard" router={router} />

      <main style={{ flex: 1, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>My Portfolio</h1>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
              Welcome back, {user?.full_name?.split(' ')[0]} 👋
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6' }}>{formatINR(capital)}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Trading Capital</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard icon="💰" value={formatINR(portfolio?.cash || capital)} label="Available Cash" color="#22c55e" />
          <StatCard icon="📊" value={formatINR(invested)} label="Invested" color="#f59e0b" />
          <StatCard icon="📈" value={positions.length} label="Open Positions" color="#8b5cf6" />
          <StatCard icon="🎯" value={stats ? stats.win_rate.toFixed(1) + '%' : '-'} label="Win Rate" color="#14b8a6" />
        </div>

        {/* Positions */}
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Open Positions</h2>
        {positions.length === 0 ? (
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 40, textAlign: 'center', color: '#64748b' }}>
            No positions yet. Bot will auto-open positions based on signals.
          </div>
        ) : (
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Symbol', 'Qty', 'Entry Price', 'Current Value', 'Strategy', 'P&L', 'Stop Loss'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #334155' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(p => {
                  const currentVal = p.quantity * Number(p.current_price || p.entry_price);
                  const investedVal = p.quantity * Number(p.entry_price);
                  const pnl = currentVal - investedVal;
                  const pnlPct = (pnl / investedVal * 100).toFixed(2);
                  return (
                    <tr key={p.symbol} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{p.symbol}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 13 }}>{p.quantity}</td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 13 }}>{formatINR(Number(p.entry_price))}</td>
                      <td style={{ padding: '10px 14px', color: '#fff', fontWeight: 600, fontSize: 13 }}>{formatINR(currentVal)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>{p.strategy}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13, color: pnl >= 0 ? '#86efac' : '#fca5a5' }}>
                        {pnl >= 0 ? '+' : ''}{formatINR(pnl)} ({pnlPct}%)
                      </td>
                      <td style={{ padding: '10px 14px', color: '#fca5a5', fontSize: 13 }}>{p.stop_loss ? formatINR(p.stop_loss) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Trading Stats</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <StatCard icon="🔄" value={stats.total_trades} label="Total Trades" />
              <StatCard icon="✅" value={stats.wins} label="Wins" color="#22c55e" />
              <StatCard icon="❌" value={stats.losses} label="Losses" color="#ef4444" />
              <StatCard icon="💰" value={formatINR(stats.total_pnl)} label="Total P&L" color={stats.total_pnl >= 0 ? '#22c55e' : '#ef4444'} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
