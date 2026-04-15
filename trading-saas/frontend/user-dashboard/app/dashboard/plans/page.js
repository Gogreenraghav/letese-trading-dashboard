'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('user_token');
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) { window.location.href = '/'; return null; }
  return res.json();
}

const SIDEBAR = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '📈', label: 'Signals', href: '/dashboard/signals' },
  { icon: '💰', label: 'My Trades', href: '/dashboard/trades' },
  { icon: '📋', label: 'Portfolio', href: '/dashboard/portfolio' },
  { icon: '⭐', label: 'Watchlist', href: '/dashboard/watchlist' },
  { icon: '🪙', label: 'Credits', href: '/dashboard/credits' },
  { icon: '🔗', label: 'Broker API', href: '/dashboard/brokers' },
  { icon: '📋', label: 'Plans', href: '/dashboard/plans' },
  { icon: '⚙️', label: 'Settings', href: '/dashboard/account' },
];

const FEATURE_DESCRIPTIONS = {
  dashboard_view: 'View signals dashboard',
  paper_trading: 'Paper trading mode',
  signal_alerts: '📊 Receive BUY/SELL signal alerts',
  telegram_alerts: '📲 Telegram notifications for signals',
  auto_trading: '🤖 Bot auto-executes trades (broker required)',
  broker_api: '🔗 Connect Zerodha/Samco broker API',
  stop_loss: '🛡️ Automatic stop-loss protection',
  trailing_sl: '📈 Trailing stop-loss lock profits',
  brackets: '📦 Bracket orders (target + stop-loss together)',
  live_signals: '⚡ Real-time signal delivery',
  backtest: '📉 Backtest strategies on historical data',
  api_access: '🔌 Developer API access',
  white_label: '✨ White-label branding',
  priority_support: '🎧 Priority support',
  multi_user: '👥 Multi-user team access',
};

const SIGNAL_FEATURES = ['dashboard_view', 'paper_trading', 'signal_alerts', 'telegram_alerts', 'live_signals'];
const AUTO_FEATURES = ['auto_trading', 'broker_api', 'stop_loss', 'trailing_sl', 'brackets'];

export default function PlansPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [myPlan, setMyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [upgradeMsg, setUpgradeMsg] = useState(null);
  const [upgradeError, setUpgradeError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { router.push('/'); return; }

    async function load() {
      const [meData, plansData, myPlanData] = await Promise.all([
        apiCall('/api/auth/me'),
        apiCall('/api/plans'),
        apiCall('/api/plans/my'),
      ]);
      if (!meData) return;
      setUser(meData.user || meData);
      if (plansData?.plans) setPlans(plansData.plans);
      if (myPlanData?.plan) setMyPlan(myPlanData);
      setLoading(false);
    }
    load();
  }, []);

  const handleUpgrade = async (planName) => {
    setUpgrading(planName);
    setUpgradeMsg(null);
    setUpgradeError(null);
    const res = await apiCall('/api/plans/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan_name: planName }),
    });
    setUpgrading(null);
    if (res?.error) {
      setUpgradeError(res.error + (res.hint ? '\n' + res.hint : ''));
    } else {
      setUpgradeMsg(`✅ Upgraded to ${planName}! ${res.subscription_end ? 'Valid till ' + new Date(res.subscription_end).toLocaleDateString('en-IN') : ''}`);
      // Reload user data
      const meData = await apiCall('/api/auth/me');
      const myPlanData = await apiCall('/api/plans/my');
      if (meData?.user) setUser(meData.user);
      if (myPlanData?.plan) setMyPlan(myPlanData);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    router.push('/');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0e1a', color: '#60a5fa', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
      <div style={{ fontSize: 18 }}>Loading plans...</div>
    </div>
  );

  const currentPlanName = user?.plan || 'free';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '28px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 2 }}>📈 NSE-BSE Trading</div>
          <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>AI-Powered Trading Platform</div>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {SIDEBAR.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: item.href === '/dashboard/plans' ? '#60a5fa' : '#9ca3af',
                textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/plans' ? 700 : 500, transition: 'all 0.15s',
                borderLeft: `3px solid ${item.href === '/dashboard/plans' ? '#60a5fa' : 'transparent'}` }}
              onMouseEnter={e => { if (item.href !== '/dashboard/plans') { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={e => { if (item.href !== '/dashboard/plans') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #1f2937' }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            {user?.full_name || user?.email}<br />
            <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 13 }}>{currentPlanName}</span>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, padding: '32px 40px', minHeight: '100vh', width: 'calc(100% - 240px)' }}>
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>📋 Plans & Pricing</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Compare Signal-only vs Auto-Trade plans. Upgrade anytime.</p>
        </div>

        {/* Current Plan Banner */}
        {myPlan && (
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', borderRadius: 20, padding: '24px 32px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #3b82f6' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{myPlan.plan?.display_name || currentPlanName}</span>
                <span style={{ padding: '4px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                  {myPlan.plan?.mode_label}
                </span>
                {myPlan.plan?.auto_trade_enabled && (
                  <span style={{ padding: '4px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 700, background: '#059669', color: '#fff' }}>
                    🤖 Auto-Trade
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {myPlan.plan?.max_trades_per_day > 0 ? `${myPlan.plan.max_trades_per_day} trades/day` : 'Signal alerts only'} ·{' '}
                {myPlan.subscription?.status === 'active' && myPlan.subscription?.end ? `Valid till ${new Date(myPlan.subscription.end).toLocaleDateString('en-IN')}` : 'Active'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>₹{(myPlan.plan?.price_monthly / 100 || 0).toFixed(0)}<span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>/mo</span></div>
              {myPlan.plan?.is_upgradable && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Upgrade available ↓</div>
              )}
            </div>
          </div>
        )}

        {/* Mode Explanation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 36 }}>
          <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>📊</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Signals Only</div>
                <div style={{ fontSize: 12, color: '#60a5fa' }}>Manual Trading</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7, marginBottom: 16 }}>
              Bot sends you <strong style={{ color: '#fff' }}>BUY/SELL alerts</strong> on Telegram/Email. You execute trades manually on your broker app. Full control — bot never touches your money.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['📲 Telegram Alerts', '📈 Live Signals', '🛡️ Stop Loss info', '📋 Trade history'].map(f => (
                <span key={f} style={{ padding: '4px 10px', background: '#1f2937', borderRadius: 8, fontSize: 11, color: '#9ca3af' }}>{f}</span>
              ))}
            </div>
          </div>
          <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: myPlan?.plan?.auto_trade_enabled ? '1px solid #34d393' : '1px solid #1f2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>🤖</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Auto Trading</div>
                <div style={{ fontSize: 12, color: '#34d393' }}>Bot Executes Trades</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7, marginBottom: 16 }}>
              Bot connects to your broker API and <strong style={{ color: '#fff' }}>auto-executes trades</strong> based on signals. Set it and forget it — bot trades 24/7.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['🔗 Broker API', '⚡ Auto Execute', '🛡️ Stop Loss', '📈 Trailing SL', '📦 Bracket Orders'].map(f => (
                <span key={f} style={{ padding: '4px 10px', background: '#1f2937', borderRadius: 8, fontSize: 11, color: '#9ca3af' }}>{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Upgrade Messages */}
        {upgradeMsg && (
          <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 12, padding: '14px 20px', marginBottom: 20, color: '#34d393', fontSize: 14, fontWeight: 600 }}>
            {upgradeMsg}
          </div>
        )}
        {upgradeError && (
          <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 12, padding: '14px 20px', marginBottom: 20, color: '#f87171', fontSize: 13, lineHeight: 1.6 }}>
            ⚠️ {upgradeError}
          </div>
        )}

        {/* Plan Cards */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 }}>All Plans</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 36 }}>
          {plans.map(plan => {
            const isCurrent = plan.name === currentPlanName;
            const features = plan.features || [];
            const signalFeats = features.filter(f => SIGNAL_FEATURES.includes(f));
            const autoFeats = features.filter(f => AUTO_FEATURES.includes(f));

            return (
              <div key={plan.name}
                style={{
                  background: isCurrent ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' : '#111827',
                  borderRadius: 20,
                  padding: 24,
                  border: isCurrent ? '2px solid #3b82f6' : '1px solid #1f2937',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                {isCurrent && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: '#fff', padding: '3px 14px', borderRadius: 9999, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    ✓ CURRENT PLAN
                  </div>
                )}

                {/* Plan header */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{plan.plan_mode === 'signal_only' ? '📊' : plan.plan_mode === 'auto_trade' ? '🤖' : '📊+🤖'}</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{plan.display_name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: isCurrent ? 'rgba(255,255,255,0.7)' : '#60a5fa', marginBottom: 12 }}>
                    {plan.mode_label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>{plan.is_free ? 'FREE' : '₹' + (plan.price_monthly / 100).toFixed(0)}</span>
                    {!plan.is_free && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>/month</span>}
                  </div>
                </div>

                {/* Mode badge */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: plan.plan_mode !== 'auto_trade' ? 'rgba(96,165,250,0.2)' : 'transparent', color: plan.plan_mode !== 'auto_trade' ? '#60a5fa' : '#4b5563', border: `1px solid ${plan.plan_mode !== 'auto_trade' ? '#3b82f6' : '#374151'}` }}>
                    📊 Signals
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: plan.auto_trade_enabled ? 'rgba(52,211,153,0.2)' : 'transparent', color: plan.auto_trade_enabled ? '#34d393' : '#4b5563', border: `1px solid ${plan.auto_trade_enabled ? '#059669' : '#374151'}` }}>
                    🤖 Auto
                  </span>
                </div>

                {/* Limits */}
                <div style={{ fontSize: 12, color: isCurrent ? 'rgba(255,255,255,0.6)' : '#6b7280', marginBottom: 16 }}>
                  {plan.max_trades_per_day > 0 ? `${plan.max_trades_per_day} trades/day` : 'No auto-trades'} ·{' '}
                  {plan.limits?.stocks === -1 ? 'Unlimited stocks' : `${plan.limits?.stocks || 5} stocks`}
                </div>

                {/* Features */}
                <div style={{ flex: 1, marginBottom: 20 }}>
                  {signalFeats.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? 'rgba(255,255,255,0.4)' : '#4b5563', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>📊 Signals</div>
                      {signalFeats.map(f => (
                        <div key={f} style={{ fontSize: 12, color: isCurrent ? 'rgba(255,255,255,0.8)' : '#9ca3af', padding: '2px 0' }}>
                          ✅ {FEATURE_DESCRIPTIONS[f] || f}
                        </div>
                      ))}
                    </div>
                  )}
                  {autoFeats.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? 'rgba(255,255,255,0.4)' : '#4b5563', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>🤖 Auto Trade</div>
                      {autoFeats.map(f => (
                        <div key={f} style={{ fontSize: 12, color: isCurrent ? 'rgba(255,255,255,0.8)' : '#9ca3af', padding: '2px 0' }}>
                          ✅ {FEATURE_DESCRIPTIONS[f] || f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {isCurrent ? (
                  <button disabled style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'default' }}>
                    ✓ Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={upgrading === plan.name}
                    style={{
                      width: '100%', padding: '12px',
                      background: plan.price_monthly === 0 ? '#1f2937' : '#1e40ff',
                      border: 'none', borderRadius: 12,
                      color: '#fff', fontSize: 14, fontWeight: 700,
                      cursor: upgrading === plan.name ? 'wait' : 'pointer',
                      opacity: upgrading === plan.name ? 0.7 : 1,
                    }}>
                    {upgrading === plan.name ? '⏳ Processing...' : plan.price_monthly === 0 ? 'Downgrade to Free' : '🪝 Upgrade to ' + plan.display_name}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Note about auto-trade */}
        <div style={{ background: '#111827', borderRadius: 16, padding: 20, border: '1px solid #374151', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>🔐</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Auto-Trade requires broker API setup</div>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
              To activate Auto-Trade plans, you must connect your broker API keys (Zerodha Kite or Samco) in the <a href="#" onClick={e => { e.preventDefault(); router.push('/dashboard/brokers'); }} style={{ color: '#60a5fa', textDecoration: 'underline' }}>Broker API</a> section. Your funds stay in your broker account — the bot only executes trades on your behalf.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
