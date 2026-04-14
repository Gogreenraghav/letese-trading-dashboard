'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || '';

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('saas_token');
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const NAV = [
  { label: '📊 Dashboard', href: '/dashboard' },
  { label: '👥 Users', href: '/dashboard/users' },
  { label: '💰 Plans', href: '/dashboard/plans' },
  { label: '📈 Analytics', href: '/dashboard/analytics' },
  { label: '📋 Logs', href: '/dashboard/logs' },
];

function StatCard({ label, value, color = '#3b82f6', sub = '' }) {
  return (
    <div style={{
      background: '#111827', borderRadius: 16, padding: 24,
      border: `1px solid #1f2937`,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function PlanBar({ name, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#d1d5db', fontWeight: 500, textTransform: 'capitalize' }}>{name}</span>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>{count} users</span>
      </div>
      <div style={{ background: '#1f2937', borderRadius: 6, height: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('/dashboard');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    const stored = localStorage.getItem('saas_user');
    if (!token) { router.push('/'); return; }
    if (stored) try { setUser(JSON.parse(stored)); } catch {}
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, usersData] = await Promise.all([
        apiCall('/api/admin/stats'),
        apiCall('/api/admin/users?limit=5'),
      ]);
      setStats(statsData);
      setRecentUsers(usersData.users || []);
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 14 }}>
      Loading dashboard...
    </div>
  );

  const breakdown = stats?.plan_breakdown || {};
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', padding: '0', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 2 }}>📊 Trading SaaS</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Super Admin Panel</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {NAV.map(item => (
            <a
              key={item.href}
              href="#"
              onClick={e => { e.preventDefault(); setActiveNav(item.href); router.push(item.href); }}
              style={{
                display: 'block', padding: '11px 20px',
                color: activeNav === item.href ? '#3b82f6' : '#9ca3af',
                background: activeNav === item.href ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderLeft: activeNav === item.href ? '3px solid #3b82f6' : '3px solid transparent',
                textDecoration: 'none', fontSize: 14, fontWeight: activeNav === item.href ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1f2937' }}>
          {user && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{user.full_name}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{user.email}</div>
            </div>
          )}
          <button onClick={logout} style={{
            display: 'block', width: '100%', padding: '9px',
            background: '#1f2937', border: 'none', borderRadius: 8,
            color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: 240, flex: 1, padding: '32px 40px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Overview of NSE-BSE Trading SaaS Platform</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
          <StatCard label="Total Users" value={stats?.total_users || 0} color="#60a5fa" />
          <StatCard label="Active Users" value={stats?.active_users || 0} color="#34d399" />
          <StatCard label="Signals Generated" value={stats?.signals_today || 0} color="#fbbf24" sub="Last 24 hours" />
          <StatCard label="MRR" value={`₹${(stats?.estimated_mrr || 0).toLocaleString('en-IN')}`} color="#a78bfa" />
        </div>

        {/* Plan Distribution + Recent Users */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
          {/* Plan Distribution */}
          <div style={{ background: '#111827', borderRadius: 16, padding: 24, border: '1px solid #1f2937' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Plan Distribution</h3>
            <PlanBar name="Free" count={breakdown.free || 0} total={total} color="#6b7280" />
            <PlanBar name="Basic (₹499)" count={breakdown.basic || 0} total={total} color="#34d399" />
            <PlanBar name="Pro (₹1,999)" count={breakdown.pro || 0} total={total} color="#60a5fa" />
            <PlanBar name="Enterprise (₹4,999)" count={breakdown.enterprise || 0} total={total} color="#a78bfa" />
            <div style={{ marginTop: 20, padding: '12px 16px', background: '#0d1117', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Estimated ARR</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>
                ₹{(stats?.estimated_arr || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Recent Users */}
          <div style={{ background: '#111827', borderRadius: 16, padding: 24, border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Recent Users</h3>
              <button onClick={() => router.push('/dashboard/users')}
                style={{ background: '#1f2937', border: 'none', borderRadius: 8, color: '#60a5fa', fontSize: 12, fontWeight: 600, padding: '6px 14px', cursor: 'pointer' }}>
                View All →
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f2937' }}>
                    {['Email', 'Plan', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#d1d5db' }}>{u.email}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999,
                          background: u.plan === 'enterprise' ? 'rgba(167,139,250,0.15)' :
                                     u.plan === 'pro' ? 'rgba(96,165,250,0.15)' :
                                     u.plan === 'basic' ? 'rgba(52,211,153,0.15)' : 'rgba(107,114,128,0.15)',
                          color: u.plan === 'enterprise' ? '#a78bfa' : u.plan === 'pro' ? '#60a5fa' :
                                 u.plan === 'basic' ? '#34d399' : '#9ca3af',
                        }}>
                          {u.plan?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 9999,
                          background: u.is_active ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
                          color: u.is_active ? '#34d399' : '#ef4444',
                        }}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { label: '+ Add New User', color: '#2563eb', href: '/dashboard/users' },
              { label: '📋 View Logs', color: '#7c3aed', href: '/dashboard/logs' },
              { label: '💰 Manage Plans', color: '#059669', href: '/dashboard/plans' },
            ].map(btn => (
              <button key={btn.label} onClick={() => router.push(btn.href)}
                style={{
                  padding: '10px 20px', background: `${btn.color}20`, border: `1px solid ${btn.color}40`,
                  borderRadius: 10, color: btn.color, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
