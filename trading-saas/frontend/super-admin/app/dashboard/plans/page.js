'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatINR } from '@/lib/api';

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Users', href: '/dashboard/users' },
  { label: 'Plans', href: '/dashboard/plans' },
  { label: 'Analytics', href: '/dashboard/analytics' },
];

const PLAN_COLORS = {
  free: { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', border: '#475569' },
  basic: { bg: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '#059669' },
  pro: { bg: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '#2563eb' },
  enterprise: { bg: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '#7c3aed' },
};

const MODE_LABELS = {
  signal_only: { label: '📊 Signal Only', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  auto_trade: { label: '🤖 Auto Trade', color: '#34d393', bg: 'rgba(52,211,153,0.15)' },
  both: { label: '📊+🤖 Both', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
};

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('/dashboard/plans');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const data = await api('/api/plans');
      setPlans(data.plans || []);
    } catch (err) { console.error('Load plans error:', err); }
    setLoading(false);
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Subscription Plans</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>Signal vs Auto-Trade plan configuration</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontSize: 12, fontWeight: 700 }}>📊 Signal Only</span>
            <span style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(52,211,153,0.15)', color: '#34d393', fontSize: 12, fontWeight: 700 }}>🤖 Auto Trade</span>
          </div>
        </div>

        {/* Mode explanation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, border: '1px solid #334155' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', marginBottom: 6 }}>📊 Signal Only Plans</div>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Users get BUY/SELL alerts. They trade manually on their broker app. Bot never executes trades.</p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, border: '1px solid #334155' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#34d393', marginBottom: 6 }}>🤖 Auto Trade Plans</div>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Bot connects to broker API and auto-executes trades. Requires verified broker credentials.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {plans.map(plan => {
              const colors = PLAN_COLORS[plan.name] || PLAN_COLORS.free;
              const mode = MODE_LABELS[plan.plan_mode] || MODE_LABELS.signal_only;
              const features = plan.features || [];
              const limits = plan.limits || {};

              return (
                <div key={plan.name} style={{ background: '#1e293b', borderRadius: 16, border: `2px solid ${colors.border}`, padding: 24, position: 'relative' }}>
                  {/* Plan name + mode badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: colors.color, fontWeight: 700, marginBottom: 4 }}>
                        {plan.display_name}
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>
                        {plan.is_free ? 'FREE' : `₹${(plan.price_monthly / 100).toFixed(0)}`}
                        {!plan.is_free && <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>/mo</span>}
                      </div>
                    </div>
                    <span style={{ padding: '5px 12px', borderRadius: 9999, background: mode.bg, color: mode.color, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {mode.label}
                    </span>
                  </div>

                  {/* Key limits */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{limits.stocks === -1 ? '∞' : (limits.stocks || 5)}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Max Stocks</div>
                    </div>
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: plan.auto_trade_enabled ? '#34d393' : '#f87171' }}>
                        {plan.auto_trade_enabled ? plan.max_trades_per_day : '❌'}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Trades/Day</div>
                    </div>
                  </div>

                  {/* Feature flags */}
                  <div style={{ background: colors.bg, borderRadius: 8, padding: '12px', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Features</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {features.map(f => (
                        <span key={f} style={{ fontSize: 11, color: '#94a3b8' }}>✅ {f.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>

                  {/* Active badge */}
                  <div style={{ fontSize: 13, color: plan.is_active ? '#34d393' : '#f87171', fontWeight: 600 }}>
                    {plan.is_active ? '✅ Active' : '❌ Inactive'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
