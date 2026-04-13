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
      const data = await api('/api/v1/admin/plans');
      setPlans(data);
    } catch (err) { console.error(err); }
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
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Subscription Plans</h1>

        {loading ? (
          <div style={{ color: '#64748b' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {plans.map(plan => {
              const colors = PLAN_COLORS[plan.name] || PLAN_COLORS.free;
              return (
                <div key={plan.id} style={{ background: '#1e293b', borderRadius: 16, border: `2px solid ${colors.border}`, padding: 24, position: 'relative' }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: colors.color, fontWeight: 700, marginBottom: 8 }}>
                    {plan.display_name}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                    {plan.price_monthly === 0 ? 'FREE' : formatINR(plan.price_monthly / 100)}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>/month</div>

                  <div style={{ background: colors.bg, borderRadius: 8, padding: '12px', marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.color, marginBottom: 8 }}>Features</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span>📊 {plan.max_stocks} stocks</span>
                      <span>💼 {plan.max_positions} positions</span>
                      <span>📈 {plan.strategies?.length || 0} strategies</span>
                      <span>🔔 Telegram: {plan.telegram_enabled ? '✅' : '❌'}</span>
                      <span>📡 Live Trading: {plan.live_trading ? '✅' : '❌'}</span>
                      <span>🧪 Backtesting: {plan.backtesting ? '✅' : '❌'}</span>
                      <span>🔌 API Access: {plan.api_access ? '✅' : '❌'}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    <span style={{ fontWeight: 700, color: colors.color }}>{plan.users_count}</span> users enrolled
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
