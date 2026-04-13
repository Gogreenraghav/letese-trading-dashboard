'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatDate } from '@/lib/api';

const PLAN_DETAILS = {
  free: { name: 'Free', price: '₹0/mo', features: ['5 stocks', '1 strategy', 'Dashboard only'] },
  basic: { name: 'Basic', price: '₹499/mo', features: ['20 stocks', '2 strategies', 'Telegram alerts', 'Paper trading'] },
  pro: { name: 'Pro', price: '₹1,999/mo', features: ['49 NSE stocks', '5 strategies', 'Telegram alerts', 'Backtesting', 'API access'] },
  enterprise: { name: 'Enterprise', price: '₹4,999/mo', features: ['Unlimited stocks', 'All strategies', 'Live trading', 'MCX commodities', 'White-label'] },
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgMsg, setTgMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    Promise.all([
      api('/api/v1/auth/me'),
      api('/api/v1/trading/stats'),
      api('/api/v1/telegram/status'),
    ]).then(([u, s, t]) => {
      setUser(u);
      setStats(s);
      setTelegramStatus(t);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api('/api/v1/auth/me', { method: 'PUT', body: JSON.stringify({ full_name: user.full_name, phone: user.phone }) });
      setMsg('Profile saved!');
    } catch (err) { setMsg('Error: ' + err.message); }
    setSaving(false);
  }

  async function connectTelegram() {
    setTgLoading(true);
    setTgMsg('');
    const chatId = prompt('Enter your Telegram Chat ID:\n\nSteps:\n1. Open @NSE_BSE_TRADE_BOT on Telegram\n2. Send /start\n3. Your Chat ID will be shown\n\nEnter the numeric Chat ID:');
    if (!chatId) { setTgLoading(false); return; }
    try {
      const res = await api('/api/v1/telegram/connect', { method: 'POST', body: JSON.stringify({ chat_id: parseInt(chatId) }) });
      setTgMsg(res.message || 'Connected!');
      setTelegramStatus({ connected: true, chat_id: parseInt(chatId) });
    } catch (err) { setTgMsg('Error: ' + err.message); }
    setTgLoading(false);
  }

  async function disconnectTelegram() {
    try {
      await api('/api/v1/telegram/disconnect', { method: 'POST' });
      setTgMsg('Telegram disconnected');
      setTelegramStatus({ connected: false });
    } catch (err) { setTgMsg('Error: ' + err.message); }
  }

  function logout() {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_user');
    router.push('/');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Loading...
      </div>
    );
  }

  const plan = PLAN_DETAILS[user?.plan_name || 'free'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#1e293b', borderRight: '1px solid #334155', padding: '24px 0' }}>
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #334155', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Trading</div>
        </div>
        {[
          { label: 'Portfolio', href: '/dashboard' },
          { label: 'Trades', href: '/dashboard/trades' },
          { label: 'Signals', href: '/dashboard/signals' },
          { label: 'Backtest', href: '/dashboard/backtest' },
          { label: 'My Account', href: '/dashboard/account' },
        ].map(item => (
          <a key={item.href} href={item.href} onClick={e => { e.preventDefault(); router.push(item.href); }}
            style={{ display: 'block', padding: '10px 16px', color: item.href === '/dashboard/account' ? '#3b82f6' : '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/account' ? 600 : 400, background: item.href === '/dashboard/account' ? 'rgba(59,130,246,0.1)' : 'transparent', borderLeft: item.href === '/dashboard/account' ? '3px solid #3b82f6' : '3px solid transparent' }}>
            {item.label}
          </a>
        ))}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', marginTop: 14 }}>
          <button onClick={logout} style={{ width: '100%', padding: '7px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 24 }}>My Account</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Profile */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Profile</h2>
            <form onSubmit={saveProfile} style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 5 }}>Full Name</label>
                <input value={(user && user.full_name) || ''} onChange={e => setUser({ ...user, full_name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 5 }}>Email</label>
                <input value={(user && user.email) || ''} disabled style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#334155', color: '#64748b', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 5 }}>Phone</label>
                <input value={(user && user.phone) || ''} onChange={e => setUser({ ...user, phone: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              {msg && <div style={{ marginBottom: 12, color: msg.includes('saved') ? '#86efac' : '#fca5a5', fontSize: 13 }}>{msg}</div>}
              <button type="submit" disabled={saving}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Plan + Telegram */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Telegram */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Telegram Alerts</h2>
              <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Connection</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      {(telegramStatus && telegramStatus.connected) ? 'Connected (Chat ID: ' + telegramStatus.chat_id + ')' : 'Not connected'}
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: (telegramStatus && telegramStatus.connected) ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: (telegramStatus && telegramStatus.connected) ? '#86efac' : '#fca5a5' }}>
                    {(telegramStatus && telegramStatus.connected) ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>
                  Get alerts on Telegram! Open <strong style={{color:'#94a3b8'}}>@NSE_BSE_TRADE_BOT</strong> and send <strong style={{color:'#94a3b8'}}>/start</strong> to get your Chat ID.
                </div>
                {tgMsg && <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, fontSize: 13, background: tgMsg.includes('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: tgMsg.includes('Error') ? '#fca5a5' : '#86efac' }}>{tgMsg}</div>}
                {(telegramStatus && telegramStatus.connected) ? (
                  <button onClick={disconnectTelegram} disabled={tgLoading} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#fca5a5', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                    Disconnect
                  </button>
                ) : (
                  <button onClick={connectTelegram} disabled={tgLoading} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                    {tgLoading ? 'Connecting...' : 'Connect Telegram'}
                  </button>
                )}
              </div>
            </div>

            {/* Plan */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 14 }}>My Plan</h2>
              <div style={{ background: '#1e293b', borderRadius: 12, border: '2px solid #3b82f6', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>{(plan && plan.name)}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{(user && user.subscription_status)}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{(plan && plan.price)}</div>
                </div>
                <div style={{ borderTop: '1px solid #334155', paddingTop: 14 }}>
                  {((plan && plan.features) || []).map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', color: '#94a3b8', fontSize: 12 }}>
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>-</span> {f}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: '#64748b' }}>
                  Valid till: {(user && user.subscription_end) ? formatDate(user.subscription_end) : 'Lifetime'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Stats */}
        {stats && (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Trading Summary</h2>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  ['Total Trades', stats.total_trades],
                  ['Win Rate', stats.win_rate.toFixed(1) + '%'],
                  ['Best Trade', 'Rs ' + (stats.best_trade || 0).toLocaleString('en-IN')],
                  ['Worst Trade', 'Rs ' + (stats.worst_trade || 0).toLocaleString('en-IN')],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{label}</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
