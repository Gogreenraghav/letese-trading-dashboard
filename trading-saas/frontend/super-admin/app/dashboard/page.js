'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, formatINR, formatDate } from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Users', href: '/dashboard/users' },
  { label: 'Plans', href: '/dashboard/plans' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Logs', href: '/dashboard/logs' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('/dashboard');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    const stored = localStorage.getItem('saas_user');
    if (!token) { router.push('/'); return; }
    if (stored) setUser(JSON.parse(stored));
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await api('/api/v1/admin/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function logout() {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_user');
    router.push('/');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
      Loading...
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#1e293b', borderRight: '1px solid #334155', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>📊 Trading SaaS</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Super Admin</div>
        </div>

        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => { e.preventDefault(); setActiveNav(item.href); router.push(item.href); }}
              style={{
                display: 'block', padding: '10px 20px', color: activeNav === item.href ? '#3b82f6' : '#94a3b8',
                textDecoration: 'none', fontSize: 14, fontWeight: activeNav === item.href ? 600 : 400,
                background: activeNav === item.href ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderLeft: activeNav === item.href ? '3px solid #3b82f6' : '3px solid transparent',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
          {user && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{user.full_name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{user.email}</div>
            </div>
          )}
          <button onClick={logout} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Dashboard</h1>

        {stats && (
          <>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Users', value: stats.total_users, icon: '👥', color: '#3b82f6' },
                { label: 'Active Users', value: stats.active_users, icon: '✅', color: '#22c55e' },
                { label: 'Trial Users', value: stats.trial_users, icon: '⏳', color: '#f59e0b' },
                { label: 'Paid Users', value: stats.paid_users, icon: '💰', color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Revenue + Trades */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Monthly Revenue', value: formatINR(stats.monthly_revenue), icon: '📈', color: '#10b981' },
                { label: 'Total Trades', value: stats.total_trades, icon: '🔄', color: '#6366f1' },
                { label: 'Today Trades', value: stats.today_trades, icon: '⚡', color: '#f97316' },
              ].map(s => (
                <div key={s.label} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trading Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Open Positions', value: stats.total_positions, icon: '📊', color: '#ec4899' },
                { label: 'Profitable Trades', value: stats.profitable_trades, icon: '📈', color: '#22c55e' },
                { label: 'Avg P&L %', value: stats.avg_pnl_percent.toFixed(2) + '%', icon: '🎯', color: '#14b8a6' },
              ].map(s => (
                <div key={s.label} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {!stats && (
          <div style={{ color: '#64748b' }}>Loading stats...</div>
        )}
      </main>
    </div>
  );
}
