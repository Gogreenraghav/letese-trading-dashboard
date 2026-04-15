'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatINR } from '@/lib/api';

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
  { label: 'Analytics', href: '/dashboard/analytics' },
];

const STATUS_COLORS = {
  connected: { bg: 'rgba(52,211,153,0.15)', color: '#34d393', label: 'Connected' },
  pending_setup: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', label: 'Pending Setup' },
  disconnected: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', label: 'Disconnected' },
  error: { bg: 'rgba(248,113,113,0.15)', color: '#f87171', label: 'Error' },
};

const BROKER_ICONS = {
  samco: '🔴',
  zerodha: '🟡',
  icici_direct: '🔵',
  hdfc_sec: '🟢',
  default: '📊',
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

export default function BrokerManagerPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', broker: 'all' });
  const [actionLoading, setActionLoading] = useState(null); // id of row being acted on
  const [actionMsg, setActionMsg] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ user_email: '', broker_name: 'samco', api_key: '', api_secret: '' });
  const [adding, setAdding] = useState(false);
  const [activeNav, setActiveNav] = useState('/dashboard/brokers');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    loadBrokers();
  }, []);

  async function loadBrokers() {
    setLoading(true);
    setActionMsg(null);
    setActionError(null);
    const params = new URLSearchParams();
    if (filter.status !== 'all') params.set('status', filter.status);
    if (filter.broker !== 'all') params.set('broker', filter.broker);
    const q = params.toString();
    const res = await adminApi('/api/admin/brokers' + (q ? '?' + q : ''));
    if (res) setData(res);
    setLoading(false);
  }

  useEffect(() => { loadBrokers(); }, [filter]);

  async function handleAction(brokerId, action, extra = {}) {
    setActionLoading(brokerId);
    setActionMsg(null);
    setActionError(null);
    let endpoint, method, body;

    if (action === 'verify') {
      endpoint = `/api/admin/brokers/${brokerId}/verify`;
      method = 'PUT';
      body = {};
    } else if (action === 'disconnect') {
      endpoint = `/api/admin/brokers/${brokerId}/disconnect`;
      method = 'PUT';
      body = {};
    } else if (action === 'delete') {
      endpoint = `/api/admin/brokers/${brokerId}`;
      method = 'DELETE';
      body = null;
    } else if (action === 'toggle_auto') {
      endpoint = `/api/admin/brokers/${brokerId}`;
      method = 'PUT';
      body = { auto_trade_enabled: !extra.current };
    }

    try {
      const res = await adminApi(endpoint, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res?.success || res?.deleted) {
        setActionMsg(`✅ Action completed successfully`);
        loadBrokers();
      } else {
        setActionError(`❌ ${res?.error || 'Action failed'}`);
      }
    } catch (e) {
      setActionError(`❌ ${e.message}`);
    }
    setActionLoading(null);
  }

  async function handleAddBroker(e) {
    e.preventDefault();
    setAdding(true);
    setActionError(null);

    // Find user by email
    const res = await adminApi(`/api/admin/users/email/${addForm.user_email}`);
    if (!res?.user) {
      setActionError('❌ User not found with this email');
      setAdding(false);
      return;
    }

    const createRes = await adminApi('/api/admin/brokers', {
      method: 'POST',
      body: JSON.stringify({
        user_id: res.user.id,
        broker_name: addForm.broker_name,
        api_key: addForm.api_key,
        api_secret: addForm.api_secret,
      }),
    });

    if (createRes?.success) {
      setActionMsg(`✅ Broker added for ${res.user.email}`);
      setAddModal(false);
      setAddForm({ user_email: '', broker_name: 'samco', api_key: '', api_secret: '' });
      loadBrokers();
    } else {
      setActionError(`❌ ${createRes?.error || 'Failed to add broker'}`);
    }
    setAdding(false);
  }

  const brokers = data?.brokers || [];
  const stats = data?.stats || {};

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>🔗 Broker API Manager</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>Manage all users' broker connections and auto-trade settings</p>
          </div>
          <button onClick={() => setAddModal(true)}
            style={{ padding: '10px 20px', background: '#1e40ff', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            ➕ Add Broker for User
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total', value: stats.total, icon: '📊', color: '#60a5fa' },
            { label: 'Connected', value: stats.connected, icon: '✅', color: '#34d393' },
            { label: 'Pending', value: stats.pending, icon: '⏳', color: '#fbbf24' },
            { label: 'Disconnected', value: stats.disconnected, icon: '❌', color: '#9ca3af' },
            { label: 'Error', value: stats.error, icon: '⚠️', color: '#f87171' },
            { label: 'Auto-Trading', value: stats.auto_trade_active, icon: '🤖', color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1e293b', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value || 0}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {actionMsg && (
          <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: '#34d393', fontSize: 14, fontWeight: 600 }}>
            {actionMsg}
          </div>
        )}
        {actionError && (
          <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: '#f87171', fontSize: 14 }}>
            {actionError}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>Status:</span>
            {['all', 'connected', 'pending_setup', 'disconnected'].map(s => (
              <button key={s} onClick={() => setFilter(f => ({ ...f, status: s }))}
                style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #334155', background: filter.status === s ? '#1e40ff' : '#1e293b', color: filter.status === s ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>Broker:</span>
            {['all', 'samco', 'zerodha'].map(b => (
              <button key={b} onClick={() => setFilter(f => ({ ...f, broker: b }))}
                style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #334155', background: filter.broker === b ? '#1e40ff' : '#1e293b', color: filter.broker === b ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                {b === 'all' ? 'All Brokers' : b}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>{brokers.length} result(s)</span>
        </div>

        {/* Broker Table */}
        <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 2fr', background: '#0f172a', borderBottom: '1px solid #334155', padding: '12px 20px' }}>
            {['User', 'Broker', 'Status', 'Verified', 'Auto-Trade', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
          ) : brokers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              No brokers found for selected filters.
            </div>
          ) : (
            brokers.map(b => {
              const statusStyle = STATUS_COLORS[b.broker_status] || STATUS_COLORS.disconnected;
              const isLoading = actionLoading === b.id;

              return (
                <div key={b.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 2fr',
                  padding: '14px 20px',
                  borderBottom: '1px solid #334155',
                  alignItems: 'center',
                  opacity: isLoading ? 0.6 : 1,
                }}>
                  {/* User */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{b.full_name || b.user_email}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{b.user_email}</div>
                    <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', marginTop: 2, display: 'inline-block' }}>
                      {b.plan}
                    </span>
                  </div>

                  {/* Broker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{BROKER_ICONS[b.broker_name] || BROKER_ICONS.default}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{b.broker_name}</div>
                      <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{b.api_key || '—'}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{ padding: '4px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: statusStyle.bg, color: statusStyle.color }}>
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Verified */}
                  <div>
                    <span style={{ padding: '4px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: b.is_verified ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: b.is_verified ? '#34d393' : '#f87171' }}>
                      {b.is_verified ? '✅ Verified' : '❌ Unverified'}
                    </span>
                  </div>

                  {/* Auto-Trade */}
                  <div>
                    <button
                      onClick={() => handleAction(b.id, 'toggle_auto', { current: b.auto_trade_enabled })}
                      disabled={isLoading || !b.is_verified}
                      style={{
                        padding: '4px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                        background: b.auto_trade_enabled ? 'rgba(167,139,250,0.2)' : '#1e293b',
                        color: b.auto_trade_enabled ? '#a78bfa' : '#9ca3af',
                        border: `1px solid ${b.auto_trade_enabled ? '#7c3aed' : '#374151'}`,
                        cursor: isLoading || !b.is_verified ? 'not-allowed' : 'pointer',
                      }}>
                      🤖 {b.auto_trade_enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {!b.is_verified && (
                      <button onClick={() => handleAction(b.id, 'verify')}
                        disabled={isLoading}
                        style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #059669', background: 'rgba(52,211,153,0.1)', color: '#34d393', fontSize: 11, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                        {isLoading && actionLoading === b.id ? '...' : '✅ Verify'}
                      </button>
                    )}
                    {b.is_verified && b.broker_status === 'connected' && (
                      <button onClick={() => handleAction(b.id, 'disconnect')}
                        disabled={isLoading}
                        style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #dc2626', background: 'rgba(248,113,113,0.1)', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                        🔌 Disconnect
                      </button>
                    )}
                    <button onClick={() => handleAction(b.id, 'delete')}
                      disabled={isLoading}
                      style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#9ca3af', fontSize: 11, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 24 }}>
          <div style={{ background: '#1e293b', borderRadius: 14, padding: 16, border: '1px solid #334155' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>✅ Verify</div>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>Mark broker as verified and activate auto-trading. Only verify after the user has completed TOTP/2FA setup on their broker account.</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 14, padding: 16, border: '1px solid #334155' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>🤖 Auto-Trade</div>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>Toggle auto-trading ON/OFF per user. Users with verified brokers and Pro/Enterprise plans can use auto-trading.</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 14, padding: 16, border: '1px solid #334155' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>🔌 Disconnect</div>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>Disconnect a broker without deleting the record. User's open positions will be preserved. They can reconnect anytime.</p>
          </div>
        </div>

        {/* Add Broker Modal */}
        {addModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) setAddModal(false); }}>
            <div style={{ background: '#1e293b', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>➕ Add Broker for User</h2>
                <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              {actionError && (
                <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>{actionError}</div>
              )}
              {actionMsg && (
                <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#34d393', fontSize: 13 }}>{actionMsg}</div>
              )}

              <form onSubmit={handleAddBroker} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>User Email *</label>
                  <input type="email" value={addForm.user_email} onChange={e => setAddForm(f => ({ ...f, user_email: e.target.value }))}
                    placeholder="user@example.com" required
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 14 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Broker</label>
                  <select value={addForm.broker_name} onChange={e => setAddForm(f => ({ ...f, broker_name: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 14 }}>
                    <option value="samco">🔴 Samco</option>
                    <option value="zerodha">🟡 Zerodha Kite</option>
                    <option value="icici_direct">🔵 ICICI Direct</option>
                    <option value="hdfc_sec">🟢 HDFC Securities</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>API Key *</label>
                  <input type="text" value={addForm.api_key} onChange={e => setAddForm(f => ({ ...f, api_key: e.target.value }))}
                    placeholder="SAMCO_CLIENT_ID or Kite API key" required
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'monospace' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>API Secret</label>
                  <input type="password" value={addForm.api_secret} onChange={e => setAddForm(f => ({ ...f, api_secret: e.target.value }))}
                    placeholder="API Secret (optional)" rows={3}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'monospace' }} />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="button" onClick={() => setAddModal(false)}
                    style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #334155', borderRadius: 10, color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={adding}
                    style={{ flex: 1, padding: '10px', background: '#1e40ff', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.6 : 1 }}>
                    {adding ? '⏳ Adding...' : '✅ Add Broker'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
