'use client';

import AdminShell from '@/components/AdminShell';
import { Scale, TrendingUp, Users, Calendar, DollarSign, ArrowRight } from 'lucide-react';

const mockCases = [
  { status: '🔴', caseName: 'S.C.Jain vs State', court: 'P&H HC', hearing: '30 Jul • 10:30 AM', active: true },
  { status: '🟡', caseName: 'Mehta vs Union', court: 'Delhi HC', hearing: '02 Aug • 11:00 AM', active: false },
  { status: '🟢', caseName: 'R.Singh vs Steel', court: 'SC', hearing: 'Order Reserved', active: false },
  { status: '🔴', caseName: 'State vs Kumar', court: 'Dist. Court', hearing: '15 Aug • 2:00 PM', active: false },
];

const mockTeam = [
  { name: 'Rajesh Sharma', role: 'Admin', initials: 'RS', status: '🟢', active: true },
  { name: 'Priya Mehta', role: 'Advocate', initials: 'PM', status: '🟢', active: true },
  { name: 'Amit Kumar', role: 'Paralegal', initials: 'AK', status: '🟡', active: false },
  { name: 'Sneha R', role: 'Intern', initials: 'SR', status: '⚫', active: false },
];

const mockDrafts = [
  { title: 'Reply to Section 5 Application', caseId: 'SC-2024-00412', time: '10 min ago', ai: true },
  { title: 'Viva Voce Arguments Draft', caseId: 'WP-2024-1182', time: '1h ago', ai: true },
  { title: 'Counter Affidavit', caseId: 'CA-2023-8891', time: '2h ago', ai: false },
  { title: 'LOC Reply Draft', caseId: 'CRLP-2024-224', time: '3h ago', ai: true },
];

const statCards = [
  { label: 'Active Cases', value: '47', icon: Scale, color: '#4A5FFF' },
  { label: 'Team Members', value: '8', icon: Users, color: '#4A5FFF' },
  { label: 'Hearings This Week', value: '12', icon: Calendar, color: '#4A5FFF' },
  { label: 'Revenue', value: '₹2.4L', icon: DollarSign, color: '#00FF88' },
];

export default function CustomerAdminDashboard() {
  return (
    <AdminShell firmName="Sharma Law Partners" userName="Rajesh Sharma" plan="Professional">
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}18` }}>
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: '#8B92A0' }}>{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Cases + Team */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Cases */}
          <div className="lg:col-span-3 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Active Cases</h2>
              <a href="/admin/cases" className="text-xs font-semibold" style={{ color: '#4A5FFF' }}>
                View All →
              </a>
            </div>
            <div className="space-y-2">
              {mockCases.map((c) => (
                <div key={c.caseName} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: c.active ? 'rgba(74,95,255,0.08)' : 'rgba(255,255,255,0.03)',
                    border: c.active ? '1px solid rgba(74,95,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                  }}>
                  <span className="text-sm">{c.status}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{c.caseName}</div>
                    <div className="text-xs" style={{ color: '#8B92A0' }}>{c.court} • {c.hearing}</div>
                  </div>
                  <ArrowRight size={14} style={{ color: '#8B92A0' }} />
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #4A5FFF, #8B5CF6)', boxShadow: '0 4px 16px rgba(74,95,255,0.3)' }}>
              + Add New Case
            </button>
          </div>

          {/* Team */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Team Members</h2>
              <a href="/admin/team" className="text-xs font-semibold" style={{ color: '#4A5FFF' }}>
                Manage →
              </a>
            </div>
            <div className="space-y-3">
              {mockTeam.map((m) => (
                <div key={m.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: m.active ? 'linear-gradient(135deg, #4A5FFF, #8B5CF6)' : '#E8EBF5',
                      color: m.active ? 'white' : '#8B92A0',
                    }}>
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{m.name}</div>
                    <div className="text-xs" style={{ color: '#8B92A0' }}>{m.role}</div>
                  </div>
                  <span className="text-sm">{m.status}</span>
                </div>
              ))}
            </div>
            <a href="/admin/team" className="block mt-4 text-sm font-semibold text-center py-2.5 rounded-xl transition-all"
              style={{ background: 'rgba(74,95,255,0.1)', color: '#4A5FFF', border: '1px solid rgba(74,95,255,0.2)' }}>
              + Invite Member
            </a>
          </div>
        </div>

        {/* AI Drafts */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Recent AI Drafts</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}>
                🤖 AI Active ✓
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {mockDrafts.map((d) => (
              <div key={d.title} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: d.ai ? 'rgba(0,255,136,0.12)' : 'rgba(255,181,71,0.12)' }}>
                  🤖
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{d.title}</div>
                  <div className="text-xs" style={{ color: '#8B92A0' }}>{d.caseId} • {d.time}</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold shrink-0"
                  style={{
                    background: d.ai ? 'rgba(0,255,136,0.12)' : 'rgba(255,181,71,0.12)',
                    color: d.ai ? '#00FF88' : '#FFB547',
                    border: d.ai ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,181,71,0.2)',
                  }}>
                  {d.ai ? 'AI ✓' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
          <a href="/admin/ai-drafts" className="block mt-4 text-sm font-semibold text-center py-2.5 rounded-xl transition-all"
            style={{ background: 'rgba(74,95,255,0.1)', color: '#4A5FFF', border: '1px solid rgba(74,95,255,0.2)' }}>
            Open AI Assistant →
          </a>
        </div>

        {/* Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card p-5">
            <h2 className="text-base font-bold text-white mb-4">This Month Billing</h2>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(74,95,255,0.08)' }}>
              <TrendingUp size={20} style={{ color: '#4A5FFF' }} />
              <div>
                <div className="text-sm font-bold text-white">Pro Plan — ₹2,000/month</div>
                <div className="text-xs" style={{ color: '#8B92A0' }}>Next billing: 1st August 2026</div>
              </div>
            </div>
            <div className="text-xs mb-2" style={{ color: '#8B92A0' }}>847 / 1000 cases used</div>
            <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: '84.7%', background: 'linear-gradient(90deg, #4A5FFF, #8B5CF6)' }} />
            </div>
            <div className="flex gap-3">
              <a href="/admin/billing" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white text-center transition-all"
                style={{ background: 'linear-gradient(135deg, #4A5FFF, #8B5CF6)', boxShadow: '0 4px 16px rgba(74,95,255,0.3)' }}>
                Upgrade Plan →
              </a>
              <a href="/admin/billing" className="py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#8B92A0', border: '1px solid rgba(255,255,255,0.08)' }}>
                Invoice →
              </a>
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="text-base font-bold text-white mb-4">Performance This Month</h2>
            {[
              { label: 'Cases Won', value: '12' },
              { label: 'Cases Lost', value: '3' },
              { label: 'Hearings Attended', value: '28' },
              { label: 'AI Drafts Generated', value: '47' },
              { label: 'Client Messages Sent', value: '156' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm" style={{ color: '#8B92A0' }}>{row.label}</span>
                <span className="text-sm font-bold" style={{ color: '#4A5FFF' }}>{row.value}</span>
              </div>
            ))}
            <a href="/admin/analytics" className="block mt-3 text-sm font-semibold text-center py-2.5 rounded-xl transition-all"
              style={{ color: '#4A5FFF' }}>
              View Full Analytics →
            </a>
          </div>
        </div>

      </div>
    </AdminShell>
  );
}
