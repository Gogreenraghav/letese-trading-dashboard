'use client'

import { useState } from 'react'
import { Scale } from 'lucide-react'

const navItems = [
  { icon: '📊', label: 'Dashboard', active: true },
  { icon: '⚖️', label: 'Cases' },
  { icon: '👥', label: 'Team' },
  { icon: '🤖', label: 'AI & Drafts' },
  { icon: '💬', label: 'Communications' },
  { icon: '📊', label: 'Analytics' },
  { icon: '💳', label: 'Billing' },
  { icon: '📱', label: 'WhatsApp' },
  { icon: '📋', label: 'Reports' },
  { icon: '⚙️', label: 'Settings' },
]

const mockCases = [
  { status: '🔴', case: 'S.C.Jain vs State', court: 'P&H HC', hearing: '30 Jul • 10:30 AM', active: true },
  { status: '🟡', case: 'Mehta vs Union', court: 'Delhi HC', hearing: '02 Aug • 11:00 AM', active: false },
  { status: '🟢', case: 'R.Singh vs Steel', court: 'SC', hearing: 'Reserved', active: false },
  { status: '🔴', case: 'State vs Kumar', court: 'Dist. Court', hearing: '15 Aug • 2:00 PM', active: false },
]

const mockTeam = [
  { name: 'Rajesh Sharma', role: 'Admin', initials: 'RS', status: '🟢', active: true },
  { name: 'Priya Mehta', role: 'Advocate', initials: 'PM', status: '🟢', active: true },
  { name: 'Amit Kumar', role: 'Paralegal', initials: 'AK', status: '🟡', active: false },
  { name: 'Sneha R', role: 'Intern', initials: 'SR', status: '⚫', active: false },
]

const mockDrafts = [
  { title: 'Reply to Section 5 Application', case: 'SC-2024-00412', time: '10 min ago', ai: true },
  { title: 'Viva Voce Arguments Draft', case: 'WP-2024-1182', time: '1h ago', ai: true },
  { title: 'Counter Affidavit', case: 'CA-2023-8891', time: '2h ago', ai: false },
  { title: 'LOC Reply Draft', case: 'CRLP-2024-224', time: '3h ago', ai: true },
]

export default function CustomerAdmin() {
  const [activeNav, setActiveNav] = useState('Dashboard')

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'rgb(240,243,250)', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: '260px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(80,112,224,0.08)',
        boxShadow: '4px 0 24px rgba(80,112,224,0.05)',
        display: 'flex', flexDirection: 'column',
        padding: '0 12px',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #5070E0, #3050B0)',
            padding: '6px 10px', borderRadius: '10px',
            display: 'flex', alignItems: 'center',
          }}>
            <Scale size={18} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '18px', fontWeight: 800, color: '#5070E0' }}>
            LETESE<span style={{ color: '#59FEAE' }}>●</span>
          </span>
        </div>
        <div style={{ padding: '0 12px 12px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#8B92A0', borderBottom: '1px solid rgba(80,112,224,0.08)', marginBottom: '12px' }}>
          Sharma Law Partners
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <div
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                margin: '2px 0',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: item.active ? 600 : 500,
                color: item.active ? '#5070E0' : '#5A6070',
                background: item.active ? 'rgba(80,112,224,0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid rgba(80,112,224,0.08)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '38px', height: '38px',
            background: 'linear-gradient(135deg, #5070E0, #3050B0)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Manrope', sans-serif", fontSize: '13px', fontWeight: 800, color: 'white',
          }}>RS</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '13px', fontWeight: 700, color: '#1A1D26' }}>Rajesh Sharma</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#8B92A0' }}>Admin</div>
          </div>
          <span style={{ fontSize: '14px', color: '#8B92A0' }}>✏️</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          height: '60px',
          background: 'linear-gradient(90deg, rgba(176,192,240,0.5) 0%, rgba(80,112,224,0.3) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center',
          padding: '0 28px',
          gap: '16px',
        }}>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '20px', fontWeight: 700, color: '#1A1D26' }}>
            Welcome back, Rajesh 👋
          </span>
          <div style={{ flex: 1 }} />
          <div style={{
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)',
            borderRadius: '9999px',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5A6070',
          }}>
            <span>🔔</span>
            <span style={{ fontWeight: 600, color: '#1A1D26' }}>5</span>
          </div>
          <button style={{
            padding: '8px 20px',
            background: 'linear-gradient(135deg, #5070E0, #3050B0)',
            color: 'white', borderRadius: '9999px',
            fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '13px',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(80,112,224,0.3)',
          }}>+ Quick Add</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Active Cases', value: '47', icon: '⚖️', color: '#5070E0' },
              { label: 'Team Members', value: '8', icon: '👥', color: '#5070E0' },
              { label: 'Hearings This Week', value: '12', icon: '📅', color: '#5070E0' },
              { label: 'Revenue', value: '₹2.4L', icon: '💰', color: '#59FEAE' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 4px 24px rgba(80,112,224,0.08)',
                border: '1px solid rgba(255,255,255,0.8)',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>{stat.icon}</div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '28px', fontWeight: 800, color: stat.color, letterSpacing: '-0.5px' }}>{stat.value}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#8B92A0' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Two column */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', marginBottom: '24px' }}>
            {/* Cases */}
            <div style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '20px', padding: '24px',
              boxShadow: '0 4px 24px rgba(80,112,224,0.08)',
              border: '1px solid rgba(255,255,255,0.8)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A1D26' }}>Active Cases</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5070E0', cursor: 'pointer', fontWeight: 600 }}>View All →</span>
              </div>
              {mockCases.map((c) => (
                <div key={c.case} style={{
                  background: c.active ? 'rgba(80,112,224,0.06)' : '#F8F9FC',
                  borderRadius: '14px', padding: '14px',
                  marginBottom: '10px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  border: c.active ? '1px solid rgba(80,112,224,0.15)' : '1px solid rgba(80,112,224,0.05)',
                }}>
                  <span style={{ fontSize: '14px' }}>{c.status}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1A1D26' }}>{c.case}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#8B92A0' }}>{c.court} • {c.hearing}</div>
                  </div>
                  <span style={{ color: '#8B92A0', fontSize: '16px' }}>›</span>
                </div>
              ))}
              <button style={{
                width: '100%', padding: '12px',
                background: 'linear-gradient(135deg, #5070E0, #3050B0)',
                color: 'white', borderRadius: '9999px',
                fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '13px',
                border: 'none', cursor: 'pointer', marginTop: '8px',
              }}>+ Add New Case</button>
            </div>

            {/* Team */}
            <div style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '20px', padding: '24px',
              boxShadow: '0 4px 24px rgba(80,112,224,0.08)',
              border: '1px solid rgba(255,255,255,0.8)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A1D26' }}>Team Members</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5070E0', cursor: 'pointer', fontWeight: 600 }}>Manage →</span>
              </div>
              {mockTeam.map((m) => (
                <div key={m.name} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(80,112,224,0.06)',
                }}>
                  <div style={{
                    width: '36px', height: '36px',
                    background: m.active ? 'linear-gradient(135deg, #5070E0, #3050B0)' : '#E8EBF5',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Manrope', sans-serif", fontSize: '12px', fontWeight: 800,
                    color: m.active ? 'white' : '#8B92A0',
                  }}>{m.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1A1D26' }}>{m.name}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#8B92A0' }}>{m.role}</div>
                  </div>
                  <span style={{ fontSize: '14px' }}>{m.status}</span>
                </div>
              ))}
              <div style={{ marginTop: '12px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5070E0', fontWeight: 600, cursor: 'pointer' }}>+ Invite Member</div>
            </div>
          </div>

          {/* AI Drafts */}
          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '20px', padding: '24px',
            boxShadow: '0 4px 24px rgba(80,112,224,0.08)',
            border: '1px solid rgba(255,255,255,0.8)',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A1D26' }}>Recent AI Drafts</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '9999px',
                  background: 'rgba(89,254,174,0.15)', color: '#59FEAE',
                  fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700,
                }}>🤖 AI ✓</span>
              </div>
            </div>
            {mockDrafts.map((d) => (
              <div key={d.title} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 0',
                borderBottom: '1px solid rgba(80,112,224,0.06)',
              }}>
                <div style={{
                  width: '36px', height: '36px',
                  background: d.ai ? 'rgba(89,254,174,0.15)' : 'rgba(255,181,71,0.15)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}>🤖</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A1D26', fontWeight: 500 }}>{d.title}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#8B92A0' }}>{d.case} • {d.time}</div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: '9999px',
                  background: d.ai ? 'rgba(89,254,174,0.15)' : 'rgba(255,181,71,0.15)',
                  color: d.ai ? '#59FEAE' : '#FFB547',
                  fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700,
                }}>{d.ai ? 'AI ✓' : 'Pending'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
