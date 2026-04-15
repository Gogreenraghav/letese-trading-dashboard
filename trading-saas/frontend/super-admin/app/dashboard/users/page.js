'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';
const SA_SIDEBAR = [
  { icon: '📊', label: 'Overview', href: '/dashboard' },
  { icon: '👥', label: 'Users', href: '/dashboard/users' },
  { icon: '📈', label: 'Analytics', href: '/dashboard/analytics' },
  { icon: '🪙', label: 'Credit Packages', href: '/dashboard/settings' },
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

const PLANS = ['free', 'basic', 'professional', 'elite', 'enterprise'];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState(null);
  const [actionType, setActionType] = useState(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    loadUsers();
  }, [page, planFilter, statusFilter]);

  async function loadUsers() {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (search) params.set('search', search);
    if (planFilter !== 'all') params.set('plan', planFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const data = await saApi(`/api/admin/users?${params}`);
    if (data?.users) {
      setUsers(data.users);
      setTotal(data.total || data.users.length);
    }
    setLoading(false);
  }

  async function handleAction(userId, action, value) {
    let endpoint, method = 'POST', body = {};
    if (action === 'suspend') { endpoint = `/api/admin/users/${userId}/suspend`; }
    else if (action === 'activate') { endpoint = `/api/admin/users/${userId}/activate`; }
    else if (action === 'change_plan') { endpoint = `/api/admin/users/${userId}/plan`; body = { plan: value }; }
    else if (action === 'delete') { endpoint = `/api/admin/users/${userId}`; method = 'DELETE'; }

    const res = await saApi(endpoint, { method, body: JSON.stringify(body) });
    if (res !== null) {
      setUsers(u => u.map(usr => {
        if (usr.id !== userId) return usr;
        if (action === 'suspend') return { ...usr, is_active: false };
        if (action === 'activate') return { ...usr, is_active: true };
        if (action === 'change_plan') return { ...usr, plan: value };
        return usr;
      }));
      if (action === 'delete') setUsers(u => u.filter(usr => usr.id !== userId));
    }
    setActionUser(null);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui' }}>
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>🛠 Super Admin</div>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {SA_SIDEBAR.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: item.href === '/dashboard/users' ? '#60a5fa' : '#9ca3af',
                background: item.href === '/dashboard/users' ? 'rgba(96,165,250,0.1)' : 'transparent',
                borderLeft: item.href === '/dashboard/users' ? '3px solid #60a5fa' : '3px solid transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/users' ? 600 : 500 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: 240, padding: '32px 40px', width: 'calc(100% - 240px)' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>👥 User Management</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Manage all users, plans, credits and account status</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Users', value: total, color: '#60a5fa' },
            { label: 'Active', value: users.filter(u => u.is_active).length, color: '#34d393' },
            { label: 'Suspended', value: users.filter(u => !u.is_active).length, color: '#f87171' },
            { label: 'Showing', value: `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)}`, color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111827', borderRadius: 16, padding: 18, border: '1px solid #1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPage(1), loadUsers())}
            placeholder="Search by name or email..."
            style={{ flex: 1, minWidth: 200, padding: '10px 16px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12, color: '#fff', fontSize: 14 }} />
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
            style={{ padding: '10px 16px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12, color: '#fff', fontSize: 14 }}>
            <option value="all">All Plans</option>
            {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '10px 16px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12, color: '#fff', fontSize: 14 }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={() => { setPage(1); loadUsers(); }}
            style={{ padding: '10px 20px', background: '#1e40ff', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            🔍 Search
          </button>
        </div>

        {/* Users Table */}
        <div style={{ background: '#111827', borderRadius: 16, border: '1px solid #1f2937', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Loading users...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#4b5563' }}>No users found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
                    {['User', 'Plan', 'Credits', 'Status', 'Joined', 'Last Login', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{u.full_name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{u.email}</div>
                        {u.phone && <div style={{ fontSize: 11, color: '#4b5563' }}>📱 {u.phone}</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <select value={u.plan || 'free'} onChange={e => handleAction(u.id, 'change_plan', e.target.value)}
                          style={{ padding: '4px 8px', background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#60a5fa', fontSize: 11, fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer' }}>
                          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#fbbf24', fontFamily: 'monospace' }}>
                        {String(u.credits_balance || '—')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: u.is_active ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: u.is_active ? '#34d393' : '#f87171' }}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Never'}
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {u.is_active ? (
                          <button onClick={() => handleAction(u.id, 'suspend')}
                            style={{ padding: '5px 10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginRight: 6 }}>
                            ⏸ Suspend
                          </button>
                        ) : (
                          <button onClick={() => handleAction(u.id, 'activate')}
                            style={{ padding: '5px 10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, color: '#34d393', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginRight: 6 }}>
                            ✅ Activate
                          </button>
                        )}
                        <button onClick={() => { if (confirm(`Delete user ${u.email}?`)) handleAction(u.id, 'delete'); }}
                          style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#4b5563', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '8px 16px', background: page <= 1 ? '#1f2937' : '#1e40ff', border: 'none', borderRadius: 10, color: page <= 1 ? '#4b5563' : '#fff', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
              ← Previous
            </button>
            <span style={{ padding: '8px 16px', color: '#9ca3af', fontSize: 13 }}>
              Page {page} of {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: '8px 16px', background: page >= totalPages ? '#1f2937' : '#1e40ff', border: 'none', borderRadius: 10, color: page >= totalPages ? '#4b5563' : '#fff', fontSize: 13, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
