'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';
const SA_SIDEBAR = [
  { icon: '📊', label: 'Overview', href: '/dashboard' },
  { icon: '👥', label: 'Users', href: '/dashboard/users' },
  { icon: '📈', label: 'Analytics', href: '/dashboard/analytics' },
  { icon: '🪙', label: 'Credit Packages', href: '/dashboard/settings' },
  { icon: '📡', label: 'Bot Health', href: '/dashboard/analytics' },
  { icon: '📜', label: 'Audit Logs', href: '/dashboard/users' },
  { icon: '⚙️', label: 'Settings', href: '/dashboard/settings' },
];

async function saApi(endpoint, opts = {}) {
  const token = localStorage.getItem('saas_token');
  const res = await fetch(`${API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...opts,
  });
  if (res.status === 401 || res.status === 403) { window.location.href = '/'; return null; }
  return res.json();
}

function fmtINR(n) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }

    async function load() {
      const [st, us] = await Promise.all([
        saApi('/api/admin/stats'),
        saApi('/api/admin/users?limit=5'),
      ]);
      if (!st) return;
      setStats(st);
      if (us?.users) {
        setUsers(us.users);
        setRecentUsers(us.users.slice(0, 5));
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('saas_token');
    router.push('/');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0e1a', color: '#60a5fa', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 18 }}>Loading admin dashboard...</div>
    </div>
  );

  const s = stats || {};

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 2 }}>🛠 Super Admin</div>
          <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>NSE-BSE Trading SaaS</div>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {SA_SIDEBAR.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#9ca3af',
                textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #1f2937', marginTop: 'auto' }}>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, padding: '32px 40px', width: 'calc(100% - 240px)' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🛠 Admin Overview</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Complete control panel for NSE-BSE Trading SaaS</p>
        </div>

        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Users', value: s.total_users || 0, color: '#60a5fa', icon: '👥' },
            { label: 'Active Plans', value: s.active_subscriptions || 0, color: '#34d393', icon: '✅' },
            { label: 'Total Signals', value: s.total_signals ? (s.total_signals > 1000 ? (s.total_signals/1000).toFixed(1)+'K' : s.total_signals) : '0', color: '#a78bfa', icon: '📈' },
            { label: 'Revenue', value: fmtINR(s.total_revenue || 0), color: '#fbbf24', icon: '💰' },
          ].map(item => (
            <div key={item.label} style={{ background: '#111827', borderRadius: 16, padding: 20, border: '1px solid #1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: item.color, fontFamily: 'monospace' }}>{item.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Middle Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Plan Distribution */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>📊 Plan Distribution</h3>
            {s.plan_distribution ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(s.plan_distribution).map(([plan, count]) => {
                  const pct = s.total_users ? Math.round((count / s.total_users) * 100) : 0;
                  const COLORS = { free: '#6b7280', basic: '#60a5fa', professional: '#a78bfa', elite: '#34d393', enterprise: '#fbbf24' };
                  return (
                    <div key={plan}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{plan}</span>
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>{count} users ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#1f2937', borderRadius: 9999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: COLORS[plan] || '#60a5fa', borderRadius: 9999, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: '#4b5563', fontSize: 14, textAlign: 'center', padding: 20 }}>No data yet</div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>⚡ Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '👥 View All Users', href: '/dashboard/users', color: '#60a5fa' },
                { label: '🪙 Manage Plans', href: '/dashboard/settings', color: '#34d393' },
                { label: '📈 View Analytics', href: '/dashboard/analytics', color: '#a78bfa' },
                { label: '📡 Bot Health', href: '#', color: '#fbbf24' },
                { label: '📜 Audit Logs', href: '#', color: '#9ca3af' },
              ].map(a => (
                <button key={a.label} onClick={() => a.href !== '#' && router.push(a.href)}
                  style={{ padding: '12px 16px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12, color: a.color, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                  {a.label} →
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>👥 Recent Users</h3>
            <button onClick={() => router.push('/dashboard/users')}
              style={{ background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#60a5fa', fontSize: 12, fontWeight: 600, padding: '6px 14px', cursor: 'pointer' }}>
              View All →
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['User', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{u.full_name || u.email}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: '#1f2937', color: '#60a5fa', textTransform: 'capitalize' }}>{u.plan || 'Free'}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: u.is_active ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: u.is_active ? '#34d393' : '#f87171' }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b7280' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#9ca3af', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => router.push('/dashboard/users')}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
