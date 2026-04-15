'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';

async function adminApi(endpoint, opts = {}) {
  const token = localStorage.getItem('saas_token');
  if (!token) return null;
  const res = await fetch(`${API}${endpoint}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) { window.location.href = '/'; return null; }
  return res.json();
}

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Users', href: '/dashboard/users' },
  { label: 'Plans', href: '/dashboard/plans' },
  { label: 'Brokers', href: '/dashboard/brokers' },
  { label: 'Reseller', href: '/dashboard/reseller' },
  { label: 'Analytics', href: '/dashboard/analytics' },
];

const PLAN_COLORS = {
  enterprise: { bg: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '#7c3aed' },
  pro: { bg: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '#2563eb' },
  basic: { bg: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '#059669' },
  free: { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', border: '#475569' },
};

const STATUS_BADGE = {
  active: { bg: 'rgba(52,211,153,0.15)', color: '#34d393' },
  trial: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  expired: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  inactive: { bg: 'rgba(100,116,139,0.15)', color: '#9ca3af' },
};

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

function formatINR(paise) {
  return '₹' + ((paise || 0) / 100).toFixed(0);
}

export default function ResellerPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [activeNav, setActiveNav] = useState('/dashboard/reseller');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [statsData, usersData, plansData] = await Promise.all([
      adminApi('/api/admin/reseller/stats'),
      adminApi('/api/admin/reseller/users'),
      adminApi('/api/admin/reseller/plans'),
    ]);
    if (statsData) setStats(statsData);
    if (usersData?.users) setUsers(usersData.users);
    if (plansData?.plans) setPlans(plansData.plans);
    setLoading(false);
  }

  async function handleSearch() {
    const data = await adminApi(`/api/admin/reseller/users?search=${encodeURIComponent(search)}&plan=${planFilter}`);
    if (data?.users) setUsers(data.users);
  }

  useEffect(() => { handleSearch(); }, [planFilter]);

  async function handlePlanChange(userId, newPlan) {
    const res = await adminApi(`/api/admin/reseller/users/${userId}/plan`, {
      method: 'PUT', body: JSON.stringify({ plan: newPlan }),
    });
    if (res?.success) {
      setActionMsg(`✅ Plan updated to ${newPlan}`);
      loadData();
    } else {
      setActionError(`❌ ${res?.error}`);
    }
  }

  async function handleToggleStatus(userId, currentActive) {
    const res = await adminApi(`/api/admin/reseller/users/${userId}/status`, {
      method: 'PUT', body: JSON.stringify({ is_active: !currentActive }),
    });
    if (res?.success) {
      setActionMsg(`✅ User ${!currentActive ? 'deactivated' : 'activated'}`);
      loadData();
    }
  }

  const s = stats || {};
  const totalRevenue = parseFloat(s.revenue?.total_revenue_inr || 0);

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
              onClick={e => { e.preventDefault(); setActiveNav(item.href); router.push(item.href); }}
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
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>👥 Reseller Panel</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Manage users, plans, subscriptions, and team access</p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Users', value: s.users?.total_users || 0, color: '#60a5fa' },
            { label: 'Enterprise', value: s.users?.enterprise_users || 0, color: '#a78bfa' },
            { label: 'Pro', value: s.users?.pro_users || 0, color: '#93c5fd' },
            { label: 'Basic', value: s.users?.basic_users || 0, color: '#6ee7b7' },
            { label: 'Free', value: s.users?.free_users || 0, color: '#94a3b8' },
            { label: 'Revenue', value: formatINR(totalRevenue * 100), color: '#34d393' },
            { label: 'Subs Active', value: s.users?.active_subs || 0, color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1e293b', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {actionMsg && (
          <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: '#34d393', fontSize: 14 }}>
            {actionMsg}
          </div>
        )}
        {actionError && (
          <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: '#f87171', fontSize: 14 }}>
            {actionError}
          </div>
        )}

        {/* Filters + Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by email, name, or phone..."
            style={{ flex: 1, padding: '10px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 14 }} />
          <button onClick={handleSearch}
            style={{ padding: '10px 20px', background: '#1e40ff', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            🔍 Search
          </button>
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
            style={{ padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 13 }}>
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* User Table */}
        <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.2fr 1fr 1fr 1.5fr', background: '#0f172a', borderBottom: '1px solid #334155', padding: '12px 20px' }}>
            {['User', 'Email / Phone', 'Plan', 'Broker Status', 'Subscription', 'Revenue', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No users found</div>
          ) : (
            users.map(u => {
              const planStyle = PLAN_COLORS[u.plan] || PLAN_COLORS.free;
              const subStatus = u.subscription_status || 'inactive';
              const subStyle = STATUS_BADGE[subStatus] || STATUS_BADGE.inactive;
              const broker = u.broker;
              const brokerBadge = broker
                ? { bg: 'rgba(52,211,153,0.15)', color: '#34d393', text: `✅ ${broker.broker_name}` }
                : { bg: 'rgba(248,113,113,0.15)', color: '#f87171', text: '❌ No broker' };

              return (
                <div key={u.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1fr 1.2fr 1fr 1fr 1.5fr',
                  padding: '14px 20px',
                  borderBottom: '1px solid #334155',
                  alignItems: 'center',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {/* User */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{u.full_name || '—'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>ID: {u.id?.slice(0, 8)}...</div>
                    <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>Joined: {timeAgo(u.created_at)}</div>
                  </div>

                  {/* Email / Phone */}
                  <div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{u.phone || '—'}</div>
                  </div>

                  {/* Plan */}
                  <div>
                    <select value={u.plan} onChange={e => handlePlanChange(u.id, e.target.value)}
                      style={{ padding: '4px 8px', background: planStyle.bg, border: `1px solid ${planStyle.border}`, borderRadius: 8, color: planStyle.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                      {['free', 'basic', 'pro', 'enterprise'].map(p => (
                        <option key={p} value={p} style={{ background: '#1e293b', color: '#fff' }}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Broker */}
                  <div>
                    <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: brokerBadge.bg, color: brokerBadge.color }}>
                      {brokerBadge.text}
                    </span>
                  </div>

                  {/* Subscription */}
                  <div>
                    <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: subStyle.bg, color: subStyle.color, textTransform: 'capitalize' }}>
                      {subStatus}
                    </span>
                    {u.subscription_end && (
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Till: {new Date(u.subscription_end).toLocaleDateString('en-IN')}</div>
                    )}
                  </div>

                  {/* Revenue */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#34d393', fontFamily: 'monospace' }}>{formatINR(u.total_revenue)}</div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleToggleStatus(u.id, u.is_active)}
                      style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #374151', background: u.is_active ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)', color: u.is_active ? '#f87171' : '#34d393', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {u.is_active ? '⛔ Deactivate' : '✅ Activate'}
                    </button>
                    <button onClick={() => setSelectedUser(u)}
                      style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      👁️ View
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Plan Distribution */}
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>📊 Plan Distribution</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {['free', 'basic', 'pro', 'enterprise'].map(plan => {
              const count = parseInt(s.users?.[`${plan}_users`] || 0);
              const total = parseInt(s.users?.total_users || 1);
              const pct = ((count / total) * 100).toFixed(1);
              const planStyle = PLAN_COLORS[plan];
              return (
                <div key={plan} style={{ background: '#1e293b', borderRadius: 16, padding: 20, border: `1px solid ${planStyle.border}` }}>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700, color: planStyle.color, letterSpacing: 1, marginBottom: 8 }}>{plan}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>{count}</div>
                  <div style={{ height: 6, background: '#0f172a', borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: planStyle.color, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{pct}% of total users</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedUser(null); }}>
            <div style={{ background: '#1e293b', borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>👤 User Details</h2>
                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Full Name', value: selectedUser.full_name || '—' },
                  { label: 'Email', value: selectedUser.email || '—' },
                  { label: 'Phone', value: selectedUser.phone || '—' },
                  { label: 'Plan', value: selectedUser.plan, highlight: true },
                  { label: 'Plan Mode', value: selectedUser.plan_mode || 'signal_only' },
                  { label: 'Auto-Trade', value: selectedUser.auto_trade_enabled ? '✅ Enabled' : '❌ Disabled' },
                  { label: 'Subscription', value: selectedUser.subscription_status || 'inactive' },
                  { label: 'Valid Till', value: selectedUser.subscription_end ? new Date(selectedUser.subscription_end).toLocaleDateString('en-IN') : '—' },
                  { label: 'Status', value: selectedUser.is_active ? '✅ Active' : '❌ Inactive' },
                  { label: 'Referred By', value: selectedUser.referred_by || 'None' },
                  { label: 'Joined', value: new Date(selectedUser.created_at).toLocaleDateString('en-IN') },
                  { label: 'Revenue', value: formatINR(selectedUser.total_revenue) },
                ].map(field => (
                  <div key={field.label} style={{ background: '#0f172a', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{field.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: field.highlight ? '#60a5fa' : '#fff', textTransform: 'capitalize' }}>{field.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => { setSelectedUser(null); handleToggleStatus(selectedUser.id, selectedUser.is_active); }}
                  style={{ flex: 1, padding: '10px', background: selectedUser.is_active ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)', border: '1px solid #374151', borderRadius: 12, color: selectedUser.is_active ? '#f87171' : '#34d393', fontWeight: 700, cursor: 'pointer' }}>
                  {selectedUser.is_active ? '⛔ Deactivate User' : '✅ Activate User'}
                </button>
                <button onClick={() => setSelectedUser(null)}
                  style={{ flex: 1, padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
