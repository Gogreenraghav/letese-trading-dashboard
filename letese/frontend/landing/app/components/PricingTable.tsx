'use client'

import { Check, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Basic',
    price: '₹999',
    period: '/month',
    description: 'For fresh advocates managing their first clients.',
    features: [
      '30 active cases',
      '1 user',
      'Case diary tracker',
      'Email reminders',
      'Client management',
      'Document upload (5 GB)',
      'Email support',
    ],
    cta: 'Start Basic Free',
    highlight: false,
    badge: null,
    note: 'No credit card required',
  },
  {
    name: 'Professional',
    price: '₹2,999',
    period: '/month',
    description: 'Full practice management for working advocates.',
    features: [
      'Unlimited cases',
      '5 team members',
      'Court scraping (P&H HC, DHC, SC)',
      'AI legal drafting',
      'WhatsApp Business reminders',
      'Collaborative document editor',
      'Invoice & billing',
      'Priority email support',
      '50 GB storage',
    ],
    cta: 'Start Pro Trial',
    highlight: true,
    badge: 'MOST POPULAR',
    note: '14-day free trial',
  },
  {
    name: 'Elite',
    price: '₹7,999',
    period: '/month',
    description: 'AI-powered suite for established advocates & small firms.',
    features: [
      'Everything in Professional',
      '15 team members',
      'Advanced AI drafting (GPT-4o + Claude)',
      'Auto case status updates',
      'Compliance rule checker',
      'Translation (Hindi ↔ English)',
      'Post-judgment analysis',
      'Dedicated support',
      '200 GB storage',
    ],
    cta: 'Start Elite Trial',
    highlight: false,
    badge: 'AI POWERED',
    note: '14-day free trial',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For law firms, corporate legal teams & bar associations.',
    features: [
      'Unlimited everything',
      'Unlimited users',
      'Custom AI fine-tuning',
      'On-premise deployment option',
      'SSO & advanced RBAC',
      'White-label option',
      'Dedicated account manager',
      '99.9% SLA guarantee',
      'Unlimited storage',
      'API access',
    ],
    cta: 'Contact Sales',
    highlight: false,
    badge: null,
    note: 'Volume pricing available',
  },
]

export default function PricingTable() {
  return (
    <section id="pricing" style={{ padding: '100px 0', background: 'white' }}>
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
            💰 SIMPLE PRICING
          </span>
          <h2 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#1A1D26',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            Plans Built for Indian Advocates
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '16px',
            color: '#5A6070',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            Start free. Scale as your practice grows. All prices in INR, GST extra.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{
              background: plan.highlight ? 'linear-gradient(135deg, #5070E0 0%, #3050B0 100%)' : 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(24px)',
              borderRadius: '24px',
              padding: plan.highlight ? '32px 28px' : '28px',
              border: plan.highlight ? 'none' : '1px solid rgba(80,112,224,0.12)',
              boxShadow: plan.highlight
                ? '0 16px 48px rgba(80,112,224,0.3)'
                : '0 4px 24px rgba(80,112,224,0.08)',
              position: 'relative',
            }}>
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: plan.highlight ? 'white' : '#5070E0',
                  color: plan.highlight ? '#5070E0' : 'white',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '20px',
                  fontWeight: 800,
                  color: plan.highlight ? 'white' : '#1A1D26',
                  marginBottom: '6px',
                }}>
                  {plan.name}
                </h3>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: plan.highlight ? 'rgba(255,255,255,0.75)' : '#5A6070',
                  lineHeight: 1.5,
                }}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: plan.price === 'Custom' ? '28px' : '36px',
                  fontWeight: 800,
                  color: plan.highlight ? 'white' : '#1A1D26',
                  lineHeight: 1,
                }}>
                  {plan.price}
                  {plan.period && (
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: plan.highlight ? 'rgba(255,255,255,0.65)' : '#8B92A0',
                    }}>
                      {plan.period}
                    </span>
                  )}
                </div>
                {plan.note && (
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    color: plan.highlight ? 'rgba(255,255,255,0.55)' : '#8B92A0',
                    marginTop: '4px',
                  }}>
                    {plan.note}
                  </div>
                )}
              </div>

              {/* CTA */}
              <Link href="/register" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px',
                background: plan.highlight ? 'white' : 'rgba(80,112,224,0.06)',
                color: plan.highlight ? '#5070E0' : '#5070E0',
                borderRadius: '14px',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700, fontSize: '14px',
                textDecoration: 'none',
                marginBottom: '24px',
                border: plan.highlight ? 'none' : '1px solid rgba(80,112,224,0.15)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = plan.highlight ? 'rgba(255,255,255,0.9)' : 'rgba(80,112,224,0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = plan.highlight ? 'white' : 'rgba(80,112,224,0.06)'
                }}>
                {plan.cta}
                <ArrowRight size={14} />
              </Link>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    color: plan.highlight ? 'rgba(255,255,255,0.9)' : '#3D4452',
                    lineHeight: 1.5,
                  }}>
                    <Check
                      size={15}
                      style={{ color: plan.highlight ? '#59FEAE' : '#5070E0', marginTop: '1px', flexShrink: 0 }}
                      strokeWidth={2.5}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ teaser */}
        <div style={{
          marginTop: '56px',
          textAlign: 'center',
          padding: '28px',
          background: '#F8F9FC',
          borderRadius: '20px',
          border: '1px solid rgba(80,112,224,0.1)',
        }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: '#5A6070',
            marginBottom: '12px',
          }}>
            All plans include 256-bit encryption, 99.9% uptime SLA, and GDPR-compliant data handling.
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5070E0', fontWeight: 600 }}>
            📞 Need a custom plan? <a href="mailto:sales@letese.xyz" style={{ color: '#5070E0', textDecoration: 'underline' }}>Talk to our sales team</a>
          </p>
        </div>
      </div>
    </section>
  )
}
