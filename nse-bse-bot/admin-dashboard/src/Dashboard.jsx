import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { getStats, getUsers, updateUser, deleteUser } from './api';

const PLAN_COLORS = { free: '#6b7280', basic: '#3b82f6', pro: '#8b5cf6', enterprise: '#f59e0b' };
const PLAN_LABELS = { free: 'Free', basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' };

function StatCard({ label, value, icon, sub }) {
  return (
    <div style={cardStyle}>
      <div style={cardTop}>
        <span style={cardIcon}>{icon}</span>
        <span style={cardLabel}>{label}</span>
      </div>
      <div style={cardValue}>{value?.toLocaleString() ?? '—'}</div>
      {sub && <div style={cardSub}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ token, user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [updating, setUpdating] = useState(null);

  const fetchStats = async () => {
    try {
      const data = await getStats(token);
      setStats(data);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const data = await getUsers(token, p, q);
      setUsers(data);
      setPage(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const handlePlanChange = async (userId, plan) => {
    setUpdating(userId);
    try {
      await updateUser(token, userId, { plan });
      fetchStats();
      fetchUsers(page, search);
    } catch (e) { console.error(e); }
    setUpdating(null);
  };

  const handleToggleActive = async (userId, currentActive) => {
    setUpdating(userId);
    try {
      await updateUser(token, userId, { is_active: !currentActive });
      fetchStats();
      fetchUsers(page, search);
    } catch (e) { console.error(e); }
    setUpdating(null);
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await deleteUser(token, userId);
      fetchStats();
      fetchUsers(page, search);
    } catch (e) { console.error(e); }
  };

  const planData = stats ? [
    { name: 'Free', value: stats.free_users || 0, fill: PLAN_COLORS.free },
    { name: 'Basic', value: stats.basic_users || 0, fill: PLAN_COLORS.basic },
    { name: 'Pro', value: stats.pro_users || 0, fill: PLAN_COLORS.pro },
    { name: 'Enterprise', value: stats.enterprise_users || 0, fill: PLAN_COLORS.enterprise },
  ].filter(d => d.value > 0) : [];

  const revenueData = stats ? [
    { name: 'Free', revenue: 0 },
    { name: 'Basic', revenue: (stats.basic_users || 0) * 499 },
    { name: 'Pro', revenue: (stats.pro_users || 0) * 1999 },
    { name: 'Enterprise', revenue: (stats.enterprise_users || 0) * 4999 },
  ] : [];

  return (
    <div style={layout}>
      {/* Sidebar */}
      <div style={sidebar}>
        <div style={sidebarLogo}>📈 LETESE</div>
        <div style={sidebarUser}>
          <div style={sidebarUserName}>{user?.full_name}</div>
          <div style={sidebarUserEmail}>{user?.email}</div>
          <div style={badgeStyle}>Admin</div>
        </div>
        <nav style={nav}>
          {[
            { key: 'overview', icon: '📊', label: 'Overview' },
            { key: 'users', icon: '👥', label: 'Users' },
            { key: 'plans', icon: '💰', label: 'Plans' },
          ].map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)} style={{ ...navBtn, ...(activeTab === item.key ? navBtnActive : {}) }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} style={logoutBtn}>🚪 Logout</button>
      </div>

      {/* Main */}
      <div style={main}>
        {/* Top Bar */}
        <div style={topBar}>
          <h1 style={pageTitle}>
            {activeTab === 'overview' ? 'Dashboard Overview' : activeTab === 'users' ? 'User Management' : 'Subscription Plans'}
          </h1>
          <div style={topBarRight}>
            <span style={timeStyle}>{new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
          </div>
        </div>

        {activeTab === 'overview' && stats && (
          <div>
            {/* Stat Cards */}
            <div style={statsGrid}>
              <StatCard icon="👥" label="Total Users" value={stats.total_users} />
              <StatCard icon="✅" label="Active Users" value={stats.active_users} />
              <StatCard icon="📈" label="Pro + Enterprise" value={(stats.pro_users || 0) + (stats.enterprise_users || 0)} />
              <StatCard icon="💰" label="Monthly Revenue (est)" value={`₹${stats.total_revenue_month?.toLocaleString()}`} sub="Based on plan prices" />
              <StatCard icon="🔔" label="Signals Generated" value={stats.total_signals_generated} />
              <StatCard icon="📋" label="Trades (This Month)" value={stats.total_trades_month} />
            </div>

            {/* Charts */}
            <div style={chartsGrid}>
              <div style={chartCard}>
                <h3 style={chartTitle}>Revenue by Plan</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                    <Bar dataKey="revenue" fill="#2563eb" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={chartCard}>
                <h3 style={chartTitle}>Users by Plan</h3>
                {planData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={planData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                        {planData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280', padding: 80 }}>No data yet</div>
                )}
                <div style={pieLegend}>
                  {planData.map(d => (
                    <div key={d.name} style={legendItem}>
                      <div style={{ ...legendDot, background: d.fill }} />
                      <span style={legendText}>{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            {/* Search */}
            <form onSubmit={handleSearch} style={searchBar}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or name..."
                style={searchInput}
              />
              <button type="submit" style={searchBtn}>Search</button>
              <button type="button" onClick={() => { setSearch(''); fetchUsers(1, ''); }} style={clearBtn}>Clear</button>
            </form>

            {/* Table */}
            <div style={tableWrap}>
              {loading ? <div style={loadingStyle}>Loading...</div> : (
                <table style={table}>
                  <thead>
                    <tr style={theadTr}>
                      <th style={th}>User</th>
                      <th style={th}>Plan</th>
                      <th style={th}>Status</th>
                      <th style={th}>Live Trading</th>
                      <th style={th}>Joined</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={tr}>
                        <td style={td}>
                          <div style={userCell}>
                            <div style={userName}>{u.full_name}</div>
                            <div style={userEmail}>{u.email}</div>
                          </div>
                        </td>
                        <td style={td}>
                          <select
                            value={u.plan}
                            onChange={(e) => handlePlanChange(u.id, e.target.value)}
                            disabled={updating === u.id}
                            style={selectStyle}
                          >
                            {['free', 'basic', 'pro', 'enterprise'].map(p => (
                              <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                            ))}
                          </select>
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => handleToggleActive(u.id, u.is_active)}
                            disabled={updating === u.id}
                            style={{ ...statusBtn, background: u.is_active ? '#052e16' : '#450a0a', color: u.is_active ? '#4ade80' : '#f87171' }}
                          >
                            {u.is_active ? '● Active' : '○ Inactive'}
                          </button>
                        </td>
                        <td style={td}>
                          <span style={{ color: u.live_trading ? '#4ade80' : '#6b7280', fontSize: 14 }}>
                            {u.live_trading ? '✓ Enabled' : '✗ Disabled'}
                          </span>
                        </td>
                        <td style={td}><span style={dateStyle}>{new Date(u.created_at).toLocaleDateString('en-IN')}</span></td>
                        <td style={td}>
                          <div style={actionBtns}>
                            {u.id !== user?.id && (
                              <button onClick={() => handleDelete(u.id)} style={delBtn}>Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div style={pagination}>
              <button onClick={() => fetchUsers(page - 1, search)} disabled={page === 1} style={pageBtn}>← Prev</button>
              <span style={pageInfo}>Page {page}</span>
              <button onClick={() => fetchUsers(page + 1, search)} disabled={users.length < 20} style={pageBtn}>Next →</button>
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div style={plansGrid}>
            {[
              { id: 'free', name: 'Free', price: 0, color: '#6b7280', features: ['Dashboard view', 'Paper trading', '5 stocks', '1 strategy', 'Telegram alerts'] },
              { id: 'basic', name: 'Basic', price: 499, color: '#3b82f6', features: ['Everything in Free', '20 stocks', 'All NSE stocks', 'Basic AI signals', 'Email support'] },
              { id: 'pro', name: 'Pro', price: 1999, color: '#8b5cf6', features: ['Everything in Basic', '50 stocks', '5 strategies', 'Live trading (Zerodha)', 'Priority support', 'Advanced AI', 'Backtesting'] },
              { id: 'enterprise', name: 'Enterprise', price: 4999, color: '#f59e0b', features: ['Everything in Pro', 'Unlimited stocks', 'All strategies', 'White-label', 'Multiple users', 'Dedicated support'] },
            ].map(plan => (
              <div key={plan.id} style={planCard(plan.color)}>
                <div style={planHeader(plan.color)}>{plan.name}</div>
                <div style={planPrice}>
                  {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  <span style={planPer}>/month</span>
                </div>
                <ul style={planFeatures}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={planFeature}>✓ {f}</li>
                  ))}
                </ul>
                <div style={planUsers}>
                  {stats?.[`${plan.id}_users`] || 0} users
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const layout = { display: 'flex', minHeight: '100vh', background: '#0a0f1c', fontFamily: '-apple-system, sans-serif' };
const sidebar = { width: 240, background: '#111827', borderRight: '1px solid #1f2937', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24, flexShrink: 0 };
const sidebarLogo = { fontSize: 22, textAlign: 'center', marginBottom: 8 };
const sidebarUser = { background: '#1f2937', borderRadius: 10, padding: 14 };
const sidebarUserName = { color: '#f9fafb', fontWeight: 600, fontSize: 14 };
const sidebarUserEmail = { color: '#6b7280', fontSize: 12, marginTop: 2 };
const badgeStyle = { display: 'inline-block', background: '#2563eb', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, marginTop: 6 };
const nav = { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 };
const navBtn = { background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 14, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 8 };
const navBtnActive = { background: '#1e3a5f', color: '#60a5fa' };
const logoutBtn = { background: 'transparent', border: '1px solid #374151', color: '#6b7280', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 };
const main = { flex: 1, padding: 28, overflowY: 'auto' };
const topBar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 };
const pageTitle = { color: '#f9fafb', fontSize: 24, fontWeight: 700, margin: 0 };
const topBarRight = { display: 'flex', gap: 12, alignItems: 'center' };
const timeStyle = { color: '#6b7280', fontSize: 13 };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 };
const cardStyle = { background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 };
const cardTop = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 };
const cardIcon = { fontSize: 20 };
const cardLabel = { color: '#9ca3af', fontSize: 13 };
const cardValue = { color: '#f9fafb', fontSize: 28, fontWeight: 700 };
const cardSub = { color: '#4b5563', fontSize: 12, marginTop: 4 };
const chartsGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 };
const chartCard = { background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 };
const chartTitle = { color: '#f9fafb', fontSize: 16, fontWeight: 600, margin: '0 0 16px' };
const pieLegend = { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, justifyContent: 'center' };
const legendItem = { display: 'flex', alignItems: 'center', gap: 6 };
const legendDot = { width: 10, height: 10, borderRadius: '50%' };
const legendText = { color: '#9ca3af', fontSize: 13 };
const searchBar = { display: 'flex', gap: 10, marginBottom: 20 };
const searchInput = { flex: 1, background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '10px 14px', color: '#f9fafb', fontSize: 14, outline: 'none' };
const searchBtn = { background: '#2563eb', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 };
const clearBtn = { background: '#374151', border: 'none', borderRadius: 8, padding: '10px 16px', color: '#9ca3af', cursor: 'pointer', fontSize: 14 };
const tableWrap = { background: '#111827', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' };
const loadingStyle = { color: '#6b7280', textAlign: 'center', padding: 40 };
const table = { width: '100%', borderCollapse: 'collapse' };
const theadTr = { background: '#1f2937' };
const th = { color: '#9ca3af', fontSize: 12, fontWeight: 600, textAlign: 'left', padding: '12px 16px', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tr = { borderTop: '1px solid #1f2937' };
const td = { padding: '14px 16px', verticalAlign: 'middle' };
const userCell = {};
const userName = { color: '#f9fafb', fontWeight: 600, fontSize: 14 };
const userEmail = { color: '#6b7280', fontSize: 12 };
const selectStyle = { background: '#1f2937', border: '1px solid #374151', borderRadius: 6, padding: '5px 8px', color: '#f9fafb', fontSize: 13, cursor: 'pointer' };
const statusBtn = { fontSize: 13, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer' };
const dateStyle = { color: '#6b7280', fontSize: 13 };
const actionBtns = { display: 'flex', gap: 8 };
const delBtn = { background: '#450a0a', border: '1px solid #7f1d1d', color: '#f87171', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' };
const pagination = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 };
const pageBtn = { background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 };
const pageInfo = { color: '#6b7280', fontSize: 14 };
const plansGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 };
const planCard = (color) => ({ background: '#111827', border: `1px solid ${color}33`, borderRadius: 12, overflow: 'hidden' });
const planHeader = (color) => ({ background: color, color: '#fff', fontWeight: 700, fontSize: 16, padding: '12px 20px', textAlign: 'center' });
const planPrice = { color: '#f9fafb', fontSize: 32, fontWeight: 700, textAlign: 'center', padding: '20px 0 4px' };
const planPer = { fontSize: 14, color: '#6b7280', fontWeight: 400 };
const planFeatures = { listStyle: 'none', padding: '16px 20px', margin: 0 };
const planFeature = { color: '#9ca3af', fontSize: 13, padding: '4px 0' };
const planUsers = { textAlign: 'center', color: '#4b5563', fontSize: 12, padding: '0 20px 20px' };