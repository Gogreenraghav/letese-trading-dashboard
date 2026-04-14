'use client';
import { useState, useEffect, useCallback } from 'react';
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

const PLAN_COLORS = {
  free:        { color: '#9ca3af', bg: 'rgba(156,163,175,0.15)' },
  basic:       { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  pro:         { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  enterprise:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
};

function UserRow({ user, onPlanChange, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const pc = PLAN_COLORS[user.plan] || PLAN_COLORS.free;

  async function handleStatus(active) {
    setLoading(true);
    try {
      await apiCall(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: active, reason: active ? 'Activated by admin' : 'Suspended by admin' }),
      });
      onStatusChange();
    } catch (err) { alert(err.message); }
    setLoading(false);
  }

  async function handlePlan(plan) {
    setLoading(true);
    try {
      await apiCall(`/api/admin/users/${user.id}/plan`, {
        method: 'PUT',
        body: JSON.stringify({ plan }),
      });
      setShowPlanModal(false);
      onPlanChange();
    } catch (err) { alert(err.message); }
    setLoading(false);
  }

  return (
    <tr style={{ borderBottom: '1px solid #1f2937', transition: 'background 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* User info */}
      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{user.full_name || '—'}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{user.email}</div>
        <div style={{ fontSize: 11, color: '#4b5563' }}>{user.phone || '—'}</div>
      </td>
      {/* Plan */}
      <td style={{ padding: '14px 16px' }}>
        <button
          onClick={() => setShowPlanModal(true)}
          style={{
            background: pc.bg, color: pc.color, border: `1px solid ${pc.color}40`,
            borderRadius: 9999, padding: '4px 14px', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', textTransform: 'capitalize',
          }}
        >
          {user.plan?.toUpperCase()}
        </button>
      </td>
      {/* Status */}
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '4px 14px', borderRadius: 9999,
          background: user.is_active ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
          color: user.is_active ? '#34d399' : '#ef4444',
        }}>
          {user.is_active ? 'Active' : 'Suspended'}
        </span>
      </td>
      {/* Subscription */}
      <td style={{ padding: '14px 16px', fontSize: 12, color: '#6b7280' }}>
        {user.subscription_status || '—'}
      </td>
      {/* Telegram */}
      <td style={{ padding: '14px 16px', fontSize: 12, color: user.telegram_chat_id ? '#34d399' : '#4b5563' }}>
        {user.telegram_chat_id ? '✅ Connected' : '❌ Not linked'}
      </td>
      {/* Joined */}
      <td style={{ padding: '14px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
        {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
      {/* Actions */}
      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
        {user.is_active ? (
          <button onClick={() => handleStatus(false)} disabled={loading}
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginRight: 6 }}>
            Suspend
          </button>
        ) : (
          <button onClick={() => handleStatus(true)} disabled={loading}
            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginRight: 6 }}>
            Activate
          </button>
        )}
        <button onClick={() => setShowPlanModal(true)}
          style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          Change Plan
        </button>
      </td>

      {/* Plan Modal */}
      {showPlanModal && (
        <td colSpan={7}>
          <div style={{ background: '#1f2937', borderRadius: 12, padding: 16, margin: 8 }}>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginBottom: 12 }}>Change Plan for {user.full_name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {['free', 'basic', 'pro', 'enterprise'].map(plan => (
                <button key={plan} onClick={() => handlePlan(plan)} disabled={loading}
                  style={{
                    padding: '10px', borderRadius: 10, border: user.plan === plan ? `2px solid ${PLAN_COLORS[plan].color}` : '1px solid #374151',
                    background: user.plan === plan ? PLAN_COLORS[plan].bg : '#0d1117',
                    color: PLAN_COLORS[plan].color, fontSize: 12, fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer', textTransform: 'capitalize',
                  }}>
                  {plan.toUpperCase()}
                  <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>
                    {plan === 'free' ? '₹0' : plan === 'basic' ? '₹499' : plan === 'pro' ? '₹1,999' : '₹4,999'}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowPlanModal(false)} style={{ marginTop: 12, background: 'transparent', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          </div>
        </td>
      )}
    </tr>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.append('search', search);
      if (planFilter) params.append('plan', planFilter);
      if (statusFilter) params.append('status', statusFilter);
      const data = await apiCall(`/api/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [page, search, planFilter, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    loadUsers();
  }, [loadUsers]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar — same as dashboard */}
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>📊 Trading SaaS</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Super Admin</div>
        </div>
        <nav style={{ padding: '16px 0' }}>
          {NAV.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{
                display: 'block', padding: '11px 20px',
                color: item.href === '/dashboard/users' ? '#3b82f6' : '#9ca3af',
                background: item.href === '/dashboard/users' ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderLeft: item.href === '/dashboard/users' ? '3px solid #3b82f6' : '3px solid transparent',
                textDecoration: 'none', fontSize: 14, fontWeight: item.href === '/dashboard/users' ? 600 : 400,
              }}>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1f2937' }}>
          <button onClick={() => { localStorage.removeItem('saas_token'); router.push('/'); }}
            style={{ width: '100%', padding: '9px', background: '#1f2937', border: 'none', borderRadius: 8, color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Users</h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>{total} total users</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            type="text" placeholder="Search email, name, phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 10, border: '1px solid #374151', background: '#111827', color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #374151', background: '#111827', color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #374151', background: '#111827', color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={loadUsers}
            style={{ padding: '10px 18px', background: '#1f2937', border: '1px solid #374151', borderRadius: 10, color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>

        {/* Table */}
        <div style={{ background: '#111827', borderRadius: 16, border: '1px solid #1f2937', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Loading users...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>No users found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
                    {['User', 'Plan', 'Status', 'Subscription', 'Telegram', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <UserRow key={u.id} user={u} onPlanChange={loadUsers} onStatusChange={loadUsers} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {page > 1 && (
              <button onClick={() => setPage(p => p - 1)}
                style={{ padding: '8px 16px', background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                ← Prev
              </button>
            )}
            <span style={{ padding: '8px 16px', color: '#6b7280', fontSize: 13 }}>Page {page} of {totalPages}</span>
            {page < totalPages && (
              <button onClick={() => setPage(p => p + 1)}
                style={{ padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                Next →
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
