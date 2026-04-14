'use client'

import { Scale, BotMessageSquare, Zap, MessageSquare, FileText, Users, Shield, BarChart3, Globe } from 'lucide-react'

const features = [
  {
    icon: Scale,
    title: 'Case Tracker',
    description: 'Track P&H HC, Delhi HC, SC, NCDRC, and district courts from one dashboard. Auto-fetch next hearing dates and orders.',
    color: '#5070E0',
    bg: '#EFF6FF',
    courts: ['P&H HC', 'Delhi HC', 'SC', 'NCDRC'],
  },
  {
    icon: BotMessageSquare,
    title: 'AI Legal Drafting',
    description: 'GPT-4o + Claude 3 powered drafting for petitions, bail applications, replies, and written statements.',
    color: '#7C3AED',
    bg: '#F5F3FF',
    courts: null,
  },
  {
    icon: Zap,
    title: 'Court Scraping (AIPOT)',
    description: '24/7 auto-scraping of new orders, judgments, and case status from 47+ Indian courts. Delivered to your dashboard.',
    color: '#F59E0B',
    bg: '#FFFBEB',
    courts: null,
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Reminders',
    description: 'Auto-send hearing reminders, order notifications, and document requests via WhatsApp Business API. Clients love it.',
    color: '#25D366',
    bg: '#F0FDF4',
    courts: null,
  },
  {
    icon: FileText,
    title: 'Collaborative Editor',
    description: 'Draft petitions with your paralegal team in real-time. Tiptap editor with Punjabi, Hindi, and English support.',
    color: '#0EA5E9',
    bg: '#ECFEFF',
    courts: null,
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Multi-user RBAC — Admin, Advocate, Clerk, Paralegal, Intern. Each sees what they need to see.',
    color: '#06B6D4',
    bg: '#ECFEFF',
    courts: null,
  },
  {
    icon: Shield,
    title: 'Client Data Security',
    description: '256-bit encryption, 2FA, role-based access. Your client data never leaves Indian servers (AWS Mumbai region).',
    color: '#10B981',
    bg: '#F0FDFA',
    courts: null,
  },
  {
    icon: BarChart3,
    title: 'Billing & Invoices',
    description: 'Generate Razorpay invoices, track payments, manage client wallet balances, and export GST-compliant reports.',
    color: '#EC4899',
    bg: '#FDF2F8',
    courts: null,
  },
]

export default function FeaturesGrid() {
  return (
    <section id="features" style={{ padding: '100px 0', background: '#F0F3FA' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'rgba(80,112,224,0.08)',
            borderRadius: '9999px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            color: '#5070E0',
            marginBottom: '16px',
          }}>
            ⚡ POWER FEATURES
          </span>
          <h2 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#1A1D26',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            Everything an Indian Advocate Needs
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '16px',
            color: '#5A6070',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            From P&H HC to Supreme Court — LETESE automates your practice so you can focus on arguments.
          </p>
        </div>

        {/* Court coverage banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px', flexWrap: 'wrap',
          marginBottom: '48px',
          padding: '14px 24px',
          background: 'rgba(80,112,224,0.06)',
          borderRadius: '16px',
          border: '1px solid rgba(80,112,224,0.12)',
        }}>
          <Globe size={16} color="#5070E0" />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5070E0' }}>
            Live court coverage:
          </span>
          {['Punjab & Haryana HC', 'Delhi High Court', 'Supreme Court', 'NCDRC', 'Chandigarh Dist. Courts', 'Consumer Forums', 'NCLT/DRT'].map(c => (
            <span key={c} style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: '#5A6070',
              background: 'white',
              padding: '4px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(80,112,224,0.15)',
            }}>
              {c}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: '24px',
                padding: '28px',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 4px 24px rgba(80,112,224,0.08)',
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(80,112,224,0.14)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(80,112,224,0.08)'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '52px', height: '52px',
                  background: feature.bg,
                  borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: `0 4px 12px ${feature.color}20`,
                }}>
                  <Icon size={26} color={feature.color} strokeWidth={2} />
                </div>

                <h3 style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1A1D26',
                  marginBottom: '10px',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#5A6070',
                  lineHeight: 1.65,
                }}>
                  {feature.description}
                </p>

                {/* Court tags */}
                {feature.courts && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {feature.courts.map(c => (
                      <span key={c} style={{
                        fontSize: '10px',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        color: feature.color,
                        background: feature.bg,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom stats */}
        <div style={{
          marginTop: '64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '20px',
        }}>
          {[
            { value: '1,24,680+', label: 'Judgments Scraped' },
            { value: '247+', label: 'Active Advocates' },
            { value: '47', label: 'Courts Live' },
            { value: '50,000+', label: 'AI Drafts Generated' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(24px)',
              borderRadius: '20px',
              padding: '22px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 4px 24px rgba(80,112,224,0.06)',
            }}>
              <div style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '26px',
                fontWeight: 800,
                color: '#5070E0',
                marginBottom: '6px',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#8B92A0',
                fontWeight: 500,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
