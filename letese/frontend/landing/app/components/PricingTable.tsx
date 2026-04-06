'use client'

import { Check, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for fresh advocates getting started.',
    features: [
      '50 active cases',
      '1 user',
      'Basic AI drafting',
      'Email support',
      'Standard case diary',
      '5 GB storage',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹2,000',
    period: '/month',
    description: 'Everything you need to run a modern law practice.',
    features: [
      'Unlimited cases',
      '10 team members',
      'Full AI drafting suite',
      'AIPOT live feed',
      'WhatsApp Business API',
      'Priority support',
      'Razorpay billing',
      '50 GB storage',
      'Collaborative editor',
    ],
    cta: 'Start Pro Trial',
    highlight: true,
    badge: 'MOST POPULAR',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large law firms and corporate legal teams.',
    features: [
      'Everything in Pro',
      'Unlimited users',
      'Dedicated account manager',
      'Custom AI fine-tuning',
      'API access',
      'SLA guarantee',
      'SSO & advanced RBAC',
      'White-label option',
      'Unlimited storage',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
]

export default function PricingTable() {
  return (
    <section id="pricing" style={{ padding: '100px 0', background: '#F0F3FA' }}>
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
            💳 SIMPLE PRICING
          </span>
          <h2 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#1A1D26',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            Plans for Every Advocate
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '16px',
            color: '#5A6070',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            Start free. Upgrade when you need more power. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          alignItems: 'stretch',
        }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.highlight
                  ? 'linear-gradient(135deg, #5070E0, #3050B0)'
                  : 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: '28px',
                padding: '32px',
                border: plan.highlight
                  ? '2px solid #3050B0'
                  : '1px solid rgba(80,112,224,0.12)',
                boxShadow: plan.highlight
                  ? '0 24px 64px rgba(80,112,224,0.3)'
                  : '0 4px 24px rgba(80,112,224,0.08)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#59FEAE',
                  color: '#1A1D26',
                  padding: '4px 20px',
                  borderRadius: '9999px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 12px rgba(89,254,174,0.4)',
                }}>
                  <Zap size={10} style={{ display: 'inline', marginRight: '4px' }} />
                  {plan.badge}
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '22px',
                  fontWeight: 800,
                  color: plan.highlight ? 'white' : '#1A1D26',
                  marginBottom: '8px',
                }}>
                  {plan.name}
                </h3>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#5A6070',
                  lineHeight: 1.5,
                }}>
                  {plan.description}
                </p>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <span style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 'clamp(32px, 4vw, 44px)',
                  fontWeight: 800,
                  color: plan.highlight ? 'white' : '#1A1D26',
                }}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: plan.highlight ? 'rgba(255,255,255,0.6)' : '#8B92A0',
                  }}>
                    {' '}{plan.period}
                  </span>
                )}
              </div>

              {/* CTA */}
              <button style={{
                width: '100%',
                padding: '14px',
                borderRadius: '9999px',
                background: plan.highlight ? 'white' : 'transparent',
                color: plan.highlight ? '#5070E0' : 'white',
                border: plan.highlight ? 'none' : '1.5px solid rgba(255,255,255,0.4)',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '28px',
                boxShadow: plan.highlight ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
              }}>
                {plan.cta}
              </button>

              {/* Features */}
              <ul style={{ listStyle: 'none', flex: 1 }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 0',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: plan.highlight ? 'rgba(255,255,255,0.85)' : '#5A6070',
                  }}>
                    <Check
                      size={16}
                      color={plan.highlight ? '#59FEAE' : '#59FEAE'}
                      strokeWidth={3}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p style={{
          textAlign: 'center',
          marginTop: '40px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: '#8B92A0',
        }}>
          All plans include GST. Enterprise billed annually. Prices in INR.
        </p>
      </div>
    </section>
  )
}
