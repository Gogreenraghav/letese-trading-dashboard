'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatDate } from '@/lib/api';

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Users', href: '/dashboard/users' },
  { label: 'Plans', href: '/dashboard/plans' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Logs', href: '/dashboard/logs' },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeNav, setActiveNav] = useState('/dashboard/analytics');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    loadData();
  }, [days]);

  async function loadData() {
    setLoading(true);
    try {
      const d = await api(`/api/v1/admin/analytics/overview?days=${days}`);
      setData(d);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#1e293b', borderRight: '1px solid #334155', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>📊 Trading SaaS</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Super Admin</div>
        </div>
        <nav>
          {NAV.map(item => (
            <a key={item.href} href={item.href}
              onClick={(e) => { e.preventDefault(); setActiveNav(item.href); router.push(item.href); }}
              style={{
                display: 'block', padding: '10px 20px', color: activeNav === item.href ? '#3b82f6' : '#94a3b8',
                textDecoration: 'none', fontSize: 14, fontWeight: activeNav === item.href ? 600 : 400,
                background: activeNav === item.href ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderLeft: activeNav === item.href ? '3px solid #3b82f6' : '3px solid transparent',
              }}
            >{item.label}</a>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>Analytics</h1>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: 14 }}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {loading ? <div style={{ color: '#64748b' }}>Loading...</div> : data ? (
          <>
            {/* Plan Distribution */}
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Plan Distribution</h2>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20, marginBottom: 32 }}>
              {data.plan_distribution?.map(p => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}>{p.name}</span>
                  <span style={{ color: '#94a3b8', fontSize: 14 }}>{p.users} users</span>
                </div>
              ))}
            </div>

            {/* User Growth */}
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 12 }}>User Growth</h2>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20, marginBottom: 32 }}>
              {data.user_growth?.length > 0 ? data.user_growth.slice(-10).map((u, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{formatDate(u.date)}</span>
                  <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: 16 }}>+{u.new_users}</span>
                </div>
              )) : <div style={{ color: '#64748b' }}>No data yet</div>}
            </div>

            {/* Trade Data */}
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Daily Trades</h2>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
              {data.trade_data?.length > 0 ? data.trade_data.slice(-10).map((t, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{formatDate(t.date)}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{t.trades} trades</span>
                  <span style={{ color: (t.total_pnl || 0) >= 0 ? '#86efac' : '#fca5a5' }}>
                    ₹{(t.total_pnl || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              )) : <div style={{ color: '#64748b' }}>No trades yet</div>}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
