'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatINR, formatDate } from '@/lib/api';

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Users', href: '/dashboard/users' },
  { label: 'Plans', href: '/dashboard/plans' },
  { label: 'Analytics', href: '/dashboard/analytics' },
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeNav, setActiveNav] = useState('/dashboard/users');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await api(`/api/v1/admin/users?limit=100&search=${search}&plan=${filterPlan}&status=${filterStatus}`);
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function suspendUser(userId) {
    if (!confirm('Suspend this user?')) return;
    try {
      await api(`/api/v1/admin/users/${userId}/suspend`, { method: 'POST' });
      loadUsers();
    } catch (err) { alert(err.message); }
  }

  async function activateUser(userId) {
    try {
      await api(`/api/v1/admin/users/${userId}/activate`, { method: 'POST' });
      loadUsers();
    } catch (err) { alert(err.message); }
  }

  async function changePlan(userId, planName) {
    try {
      await api(`/api/v1/admin/users/${userId}/plan`, {
        method: 'POST',
        body: JSON.stringify({ plan_name: planName }),
      });
      loadUsers();
    } catch (err) { alert(err.message); }
  }

  const filtered = users.filter(u => {
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPlan && u.plan !== filterPlan) return false;
    if (filterStatus && u.subscription_status !== filterStatus) return false;
    return true;
  });

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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>Users</h1>
          <button onClick={() => router.push('/')}
            onClick2={() => { localStorage.removeItem('saas_token'); router.push('/'); }}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
          >Logout</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); }}
            onKeyDown={e => e.key === 'Enter' && loadUsers()}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: 14 }}
          />
          <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); }}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: 14 }}>
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); }}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: 14 }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
          <button onClick={loadUsers} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Filter
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ color: '#64748b' }}>Loading...</div>
        ) : (
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['User', 'Plan', 'Status', 'Telegram', 'Joined', 'Last Login', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #334155' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{u.full_name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{u.phone}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: u.plan === 'enterprise' ? 'rgba(139,92,246,0.2)' : u.plan === 'pro' ? 'rgba(59,130,246,0.2)' : u.plan === 'basic' ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)',
                        color: u.plan === 'enterprise' ? '#c4b5fd' : u.plan === 'pro' ? '#93c5fd' : u.plan === 'basic' ? '#6ee7b7' : '#94a3b8',
                      }}>{u.plan?.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: u.subscription_status === 'active' ? 'rgba(34,197,94,0.2)' : u.subscription_status === 'trial' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                        color: u.subscription_status === 'active' ? '#86efac' : u.subscription_status === 'trial' ? '#fcd34d' : '#fca5a5',
                      }}>{u.subscription_status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 20 }}>{u.telegram_connected ? '✅' : '❌'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>{formatDate(u.created_at)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>{u.last_login ? formatDate(u.last_login) : 'Never'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <select
                          value={u.plan}
                          onChange={e => changePlan(u.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}
                        >
                          <option value="free">Free</option>
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        {u.is_active ? (
                          <button onClick={() => suspendUser(u.id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}>
                            Suspend
                          </button>
                        ) : (
                          <button onClick={() => activateUser(u.id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#86efac', fontSize: 12, cursor: 'pointer' }}>
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No users found</div>}
          </div>
        )}
      </main>
    </div>
  );
}
