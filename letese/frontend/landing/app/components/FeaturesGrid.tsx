'use client'

import { Scale, BotMessageSquare, Zap, MessageSquare, FileText, Users, Shield, BarChart3, Globe } from 'lucide-react'

const features = [
  {
    icon: Scale,
    title: 'Case Management',
    description: 'Manage all your court cases in one place. Track hearings, clients, documents, and deadlines effortlessly.',
    color: '#5070E0',
    bg: '#EFF6FF',
  },
  {
    icon: BotMessageSquare,
    title: 'AI Legal Drafting',
    description: 'Generate petitions, replies, and legal arguments in seconds. GPT-4 + Claude powered for accuracy.',
    color: '#59FEAE',
    bg: '#ECFDF5',
  },
  {
    icon: Zap,
    title: 'AIPOT Live Feed',
    description: '24/7 auto-scraped judgments from Supreme Court, High Courts, and Tribunals across India.',
    color: '#FFB547',
    bg: '#FFFBEB',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Alerts',
    description: 'Send case updates, hearing reminders, and documents directly to clients via WhatsApp Business.',
    color: '#25D366',
    bg: '#F0FDF4',
  },
  {
    icon: FileText,
    title: 'Collaborative Editor',
    description: 'Draft documents together with paralegals and co-counsel. Real-time multi-user editing.',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    icon: Users,
    title: 'Team RBAC',
    description: 'Assign roles — Admin, Advocate, Paralegal, Intern. Full control over who sees what.',
    color: '#06B6D4',
    bg: '#ECFEFF',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, 2FA, and role-based access. Your client data stays confidential.',
    color: '#F43F5E',
    bg: '#FFF1F2',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Track case outcomes, team performance, and revenue. Data-driven decisions for your firm.',
    color: '#10B981',
    bg: '#F0FDFA',
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
            Everything an Advocate Needs
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '16px',
            color: '#5A6070',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            From case management to AI drafting — LETESE automates the legal work so you can focus on winning.
          </p>
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
              </div>
            )
          })}
        </div>

        {/* Bottom stats */}
        <div style={{
          marginTop: '64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '24px',
        }}>
          {[
            { value: '1,24,680+', label: 'Judgments Scraped' },
            { value: '247+', label: 'Active Advocates' },
            { value: '50,000+', label: 'AI Drafts Generated' },
            { value: '99.9%', label: 'Uptime Guaranteed' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 4px 24px rgba(80,112,224,0.06)',
            }}>
              <div style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '28px',
                fontWeight: 800,
                color: '#5070E0',
                marginBottom: '6px',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
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
