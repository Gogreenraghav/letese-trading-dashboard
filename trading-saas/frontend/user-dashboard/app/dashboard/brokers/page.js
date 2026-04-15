'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';
const SIDEBAR = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '📈', label: 'Signals', href: '/dashboard/signals' },
  { icon: '💰', label: 'My Trades', href: '/dashboard/trades' },
  { icon: '📋', label: 'Portfolio', href: '/dashboard/portfolio' },
  { icon: '⭐', label: 'Watchlist', href: '/dashboard/watchlist' },
  { icon: '🪙', label: 'Credits', href: '/dashboard/credits' },
  { icon: '🔗', label: 'Broker API', href: '/dashboard/brokers' },
  { icon: '⚙️', label: 'Settings', href: '/dashboard/account' },
];

async function apiCall(endpoint, opts = {}) {
  const token = localStorage.getItem('user_token');
  const res = await fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...opts });
  if (res.status === 401) { window.location.href = '/'; return null; }
  return res.json();
}

export default function BrokersPage() {
  const router = useRouter();
  const [brokers, setBrokers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ broker_name: 'zerodha', api_key: '', api_secret: '', access_token: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { router.push('/'); return; }
    apiCall('/api/broker/keys').then(d => { if (d) setBrokers(d.brokers || []); setLoading(false); });
  }, []);

  async function handleAdd() {
    if (!form.api_key) return alert('API Key is required');
    setSaving(true);
    try {
      const res = await apiCall('/api/broker/keys', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (res?.success) {
        setBrokers(b => [...b, { ...res.broker, api_key: '***' + form.api_key.slice(-6) }]);
        setShowForm(false);
        setForm({ broker_name: 'zerodha', api_key: '', api_secret: '', access_token: '' });
        alert('✅ Broker API added successfully!');
      } else {
        alert('❌ Error: ' + (res?.error || 'Failed'));
      }
    } catch (e) { alert('❌ ' + e.message); }
    setSaving(false);
  }

  async function handleActivate(id) {
    const res = await apiCall(`/api/broker/keys/${id}/activate`, { method: 'PUT' });
    if (res?.success) {
      setBrokers(b => b.map(br => ({ ...br, is_active: br.id === id })));
      alert('✅ Broker activated!');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this broker API?')) return;
    const res = await apiCall(`/api/broker/keys/${id}`, { method: 'DELETE' });
    if (res?.success) setBrokers(b => b.filter(br => br.id !== id));
  }

  const BROKER_INFO = {
    zerodha: { name: 'Zerodha Kite', desc: 'India\'s largest discount broker. Free API access via Kite Connect.', docs: 'https://kite.trade/docs/connect/v3' },
    samco: { name: 'Samco', desc: 'Cost-effective trading with Star API. Ideal for algorithmic trading.', docs: 'https://developers.starconnect.com' },
    icici: { name: 'ICICI Direct', desc: 'Full-service broker. Smart API for institutional traders.', docs: '#' },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui' }}>
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '28px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>📈 NSE-BSE Trading</div>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {SIDEBAR.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: item.href === '/dashboard/brokers' ? '#60a5fa' : '#9ca3af',
                background: item.href === '/dashboard/brokers' ? 'rgba(96,165,250,0.1)' : 'transparent',
                borderLeft: item.href === '/dashboard/brokers' ? '3px solid #60a5fa' : '3px solid transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/brokers' ? 600 : 500 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: 240, padding: '32px 40px', width: 'calc(100% - 240px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🔗 Broker API</h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Connect your broker account to enable auto-trading. Your API keys are encrypted and stored securely.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ background: '#1e40ff', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {showForm ? '✕ Cancel' : '+ Add Broker API'}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div style={{ background: '#111827', borderRadius: 20, padding: 28, border: '1px solid #1e40ff', marginBottom: 28 }}>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Connect New Broker</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Broker</label>
                <select value={form.broker_name} onChange={e => setForm(f => ({ ...f, broker_name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, color: '#fff', fontSize: 14 }}>
                  <option value="zerodha">Zerodha Kite</option>
                  <option value="samco">Samco</option>
                  <option value="icici">ICICI Direct</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>API Key *</label>
                <input value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                  placeholder="e.g., abcd1234efgh5678"
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, color: '#fff', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>API Secret</label>
                <input value={form.api_secret} onChange={e => setForm(f => ({ ...f, api_secret: e.target.value }))}
                  type="password" placeholder="API Secret"
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, color: '#fff', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>Access Token</label>
                <input value={form.access_token} onChange={e => setForm(f => ({ ...f, access_token: e.target.value }))}
                  type="password" placeholder="Access Token (from Kite)"
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, color: '#fff', fontSize: 14 }} />
              </div>
            </div>
            {form.broker_name === 'zerodha' && (
              <div style={{ background: '#0f172a', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#9ca3af' }}>
                📋 <strong style={{ color: '#fff' }}>Zerodha Kite Connect:</strong> Generate your API key at <a href="https://kite.trade" target="_blank" style={{ color: '#60a5fa' }}>kite.trade</a> → My Account → Generate API Key
              </div>
            )}
            <button onClick={handleAdd} disabled={saving}
              style={{ padding: '12px 32px', background: saving ? '#1c2ebc' : '#1e40ff', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳ Saving...' : '✅ Save & Connect'}
            </button>
          </div>
        )}

        {/* Connected Brokers */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Connected Brokers</h2>
        {brokers.length === 0 && !loading ? (
          <div style={{ background: '#111827', borderRadius: 20, padding: 48, border: '1px solid #1f2937', textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No Broker Connected</p>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Connect your broker API to enable automatic order placement</p>
            <button onClick={() => setShowForm(true)}
              style={{ padding: '12px 28px', background: '#1e40ff', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              + Connect Zerodha Kite
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            {brokers.map(b => (
              <div key={b.id} style={{ background: '#111827', borderRadius: 16, padding: 20, border: b.is_active ? '1px solid #34d393' : '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {b.broker_name === 'zerodha' ? '📊' : b.broker_name === 'samco' ? '📈' : '🏦'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{b.broker_name}</span>
                    {b.is_active && <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: 'rgba(52,211,153,0.15)', color: '#34d393' }}>ACTIVE</span>}
                    {b.is_verified ? <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>VERIFIED</span> : <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>PENDING</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>API: {b.api_key || '—'} · Added {b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!b.is_active && <button onClick={() => handleActivate(b.id)} style={{ padding: '8px 16px', background: '#34d393', border: 'none', borderRadius: 10, color: '#0a0e1a', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Activate</button>}
                  <button onClick={() => handleDelete(b.id)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #1f2937', borderRadius: 10, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available Brokers */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Available Brokers</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {Object.entries(BROKER_INFO).map(([key, info]) => (
            <div key={key} style={{ background: '#111827', borderRadius: 16, padding: 24, border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{key === 'zerodha' ? '📊' : key === 'samco' ? '📈' : '🏦'}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{info.name}</h3>
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, marginBottom: 16 }}>{info.desc}</p>
              <a href={info.docs} target="_blank" rel="noreferrer"
                style={{ display: 'inline-block', padding: '8px 16px', background: '#1f2937', borderRadius: 10, color: '#60a5fa', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                📖 API Docs →
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
