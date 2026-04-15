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
  { label: 'Wallet / Top-Up', href: '/dashboard/wallet' },
  { label: 'Analytics', href: '/dashboard/analytics' },
];

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

function fmt(u) {
  return '₹' + (parseFloat(u.wallet_balance) || 0).toFixed(2);
}

export default function WalletPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [topupAmt, setTopupAmt] = useState('');
  const [deductAmt, setDeductAmt] = useState('');
  const [note, setNote] = useState('');
  const [action, setAction] = useState(null); // 'topup' | 'deduct' | 'view'
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [activeNav, setActiveNav] = useState('/dashboard/wallet');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const res = await adminApi('/api/admin/wallet/users');
    if (res) setData(res);
    setLoading(false);
  }

  async function selectUser(user, mode) {
    setSelectedUser(user);
    setAction(mode);
    setTopupAmt('');
    setDeductAmt('');
    setNote('');
    setMsg(null);
    setErr(null);

    if (mode === 'view') {
      const detail = await adminApi(`/api/admin/wallet/users/${user.id}`);
      if (detail) setSelectedUser({ ...user, ...detail.user, transactions: detail.transactions });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    setErr(null);

    const amount_rs = action === 'topup' ? topupAmt : deductAmt;
    const endpoint = action === 'topup' ? '/api/admin/wallet/topup' : '/api/admin/wallet/deduct';

    const res = await adminApi(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        user_id: selectedUser.id,
        amount_rs: parseFloat(amount_rs),
        note,
      }),
    });

    setSubmitting(false);

    if (res?.success) {
      setMsg(`✅ ${res.message}`);
      setTopupAmt('');
      setDeductAmt('');
      setNote('');
      loadData();
      if (action === 'view') {
        const detail = await adminApi(`/api/admin/wallet/users/${selectedUser.id}`);
        if (detail) setSelectedUser({ ...selectedUser, ...detail.user, transactions: detail.transactions });
      }
    } else {
      setErr(`❌ ${res?.error || 'Action failed'}`);
    }
  }

  const users = (data?.users || []).filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>💰 Wallet — Manual Top-Up</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Add or deduct balance for users manually. No online payment needed.</p>
        </div>

        {/* Total Wallet Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(30,64,175,0.3), rgba(96,165,250,0.1))', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 20, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace' }}>{fmt({ wallet_balance: data?.total_wallet_balance })}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Total Wallet Balance (All Users)</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 20, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#34d393', fontFamily: 'monospace' }}>{users.filter(u => parseFloat(u.wallet_balance) > 0).length}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Users with Balance</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 20, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>{users.length}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Total Registered Users</div>
          </div>
        </div>

        {/* Alerts */}
        {msg && (
          <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: '#34d393', fontSize: 14, fontWeight: 600 }}>
            {msg}
          </div>
        )}
        {err && (
          <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'flex-start' }}>
          {/* User Wallet Table */}
          <div>
            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                style={{ width: '100%', padding: '10px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 14 }} />
            </div>

            <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', background: '#0f172a', borderBottom: '1px solid #334155', padding: '12px 20px' }}>
                {['User', 'Balance', 'Total Spent', 'Plan', 'Actions'].map(h => (
                  <div key={h} style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                ))}
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
              ) : users.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No users found</div>
              ) : (
                users.map(u => (
                  <div key={u.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr',
                    padding: '14px 20px',
                    borderBottom: '1px solid #334155',
                    alignItems: 'center',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {/* User */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{u.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{u.email}</div>
                    </div>
                    {/* Balance */}
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: parseFloat(u.wallet_balance) > 0 ? '#34d393' : '#9ca3af', fontFamily: 'monospace' }}>
                        {fmt(u)}
                      </div>
                    </div>
                    {/* Spent */}
                    <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#9ca3af' }}>
                      ₹{(parseFloat(u.total_spent_paise || 0) / 100).toFixed(0)}
                    </div>
                    {/* Plan */}
                    <div>
                      <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', textTransform: 'capitalize' }}>
                        {u.plan}
                      </span>
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => selectUser(u, 'topup')}
                        style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #059669', background: 'rgba(52,211,153,0.1)', color: '#34d393', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        ➕ Add ₹
                      </button>
                      <button onClick={() => selectUser(u, 'deduct')}
                        style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #dc2626', background: 'rgba(248,113,113,0.1)', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        ➖ Deduct ₹
                      </button>
                      <button onClick={() => selectUser(u, 'view')}
                        style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        👁️ History
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Side Panel */}
          {selectedUser && (
            <div style={{ background: '#1e293b', borderRadius: 20, border: '1px solid #334155', padding: 24, position: 'sticky', top: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{selectedUser.full_name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{selectedUser.email}</div>
                </div>
                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>

              {/* Current Balance */}
              <div style={{ background: '#0f172a', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center', border: '1px solid #334155' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Current Balance</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace' }}>
                  ₹{((selectedUser.credits_balance || parseFloat(selectedUser.wallet_balance) || 0) * 1).toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                  Total spent: ₹{(parseFloat(selectedUser.total_spent) || (parseFloat(selectedUser.total_spent_paise || 0) / 100)).toFixed(2)}
                </div>
              </div>

              {/* Tabs */}
              {action !== 'view' ? (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                      Amount (₹) {action === 'topup' ? '— Added as credits' : '— Deducted from balance'}
                    </label>
                    <input type="number" min="1" step="1"
                      value={action === 'topup' ? topupAmt : deductAmt}
                      onChange={e => action === 'topup' ? setTopupAmt(e.target.value) : setDeductAmt(e.target.value)}
                      placeholder="e.g. 500"
                      required
                      style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 20, fontFamily: 'monospace', fontWeight: 700 }} />
                    {topupAmt && action === 'topup' && (
                      <div style={{ fontSize: 12, color: '#34d393', marginTop: 4 }}>
                        → {parseInt(topupAmt)} credits will be added
                      </div>
                    )}
                    {deductAmt && action === 'deduct' && (
                      <div style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>
                        → {parseInt(deductAmt)} credits will be deducted
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Note (optional)</label>
                    <input type="text" value={note} onChange={e => setNote(e.target.value)}
                      placeholder="e.g. Recharged via UPI transfer"
                      style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 13 }} />
                  </div>

                  <button type="submit" disabled={submitting}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                      background: action === 'topup' ? '#059669' : '#dc2626', color: '#fff', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? '⏳ Processing...' : action === 'topup' ? `✅ Add ₹${topupAmt || 0} to ${selectedUser.full_name || 'user'}` : `➖ Deduct ₹${deductAmt || 0}`}
                  </button>
                </form>
              ) : (
                /* Transaction History */
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>📜 Transaction History</div>
                  {(selectedUser.transactions || []).length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>No transactions yet</div>
                  ) : (
                    <div style={{ maxHeight: 400, overflow: 'auto' }}>
                      {(selectedUser.transactions || []).map((tx, i) => (
                        <div key={tx.id || i} style={{ padding: '10px 0', borderBottom: '1px solid #334155' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>
                                {tx.transaction_type?.replace(/_/g, ' ') || 'Transaction'}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>{tx.description || '—'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: tx.amount > 0 ? '#34d393' : '#f87171', fontFamily: 'monospace' }}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                              </div>
                              <div style={{ fontSize: 10, color: '#4b5563' }}>{timeAgo(tx.created_at)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!selectedUser && (
            <div style={{ background: '#1e293b', borderRadius: 20, border: '1px dashed #334155', padding: 40, textAlign: 'center', alignSelf: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>Click "Add ₹" or "Deduct ₹" on any user to manage their balance</div>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ marginTop: 28, background: '#1e293b', borderRadius: 14, padding: 16, border: '1px solid #334155', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
            <strong style={{ color: '#94a3b8' }}>Offline Payment System:</strong> Add ₹ directly to a user's wallet — no Razorpay needed. User can trade with this balance. Each ₹1 = 1 credit. Admin can also deduct balance if needed.
          </div>
        </div>
      </main>
    </div>
  );
}
