'use client'

import { ArrowRight, Scale } from 'lucide-react'

export default function CTASection() {
  return (
    <section style={{
      padding: '80px 0',
      background: 'linear-gradient(135deg, #5070E0 0%, #3050B0 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative */}
      <div style={{
        position: 'absolute',
        top: '-60px', right: '-60px',
        width: '300px', height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(89,254,174,0.15) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-40px', left: '-40px',
        width: '200px', height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
      }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div style={{
          width: '64px', height: '64px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <Scale size={28} color="white" strokeWidth={2} />
        </div>

        <h2 style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 800,
          color: 'white',
          lineHeight: 1.2,
          marginBottom: '16px',
        }}>
          Ready to Transform Your Practice?
        </h2>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '16px',
          color: 'rgba(255,255,255,0.8)',
          lineHeight: 1.7,
          marginBottom: '40px',
          maxWidth: '500px',
          margin: '0 auto 40px',
        }}>
          Join 247+ advocates already using LETESE to win more cases, save time, and delight clients.
          Start your free trial today — no credit card required.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '16px 36px',
            background: 'white',
            color: '#5070E0',
            borderRadius: '9999px',
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 700,
            fontSize: '15px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>
            Start Free Trial
            <ArrowRight size={18} />
          </button>
          <button style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '16px 36px',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
            color: 'white',
            borderRadius: '9999px',
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 700,
            fontSize: '15px',
            border: '1.5px solid rgba(255,255,255,0.3)',
            cursor: 'pointer',
          }}>
            Book a Demo
          </button>
        </div>

        {/* Trust */}
        <p style={{
          marginTop: '28px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
        }}>
          🔒 Enterprise-grade security • ⚡ Setup in 5 minutes • 🚀 Cancel anytime
        </p>
      </div>
    </section>
  )
}
