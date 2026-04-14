'use client'

import { Scale, Play, ArrowRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function Hero() {
  const [playing, setPlaying] = useState(false)

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #B0C0F0 0%, #819BFF 25%, #5070E0 60%, #3050B0 100%)',
      }}
    >
      {/* Decorative circles */}
      <div className="absolute top-20 right-20 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-40 left-10 w-60 h-60 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
      <div className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(89,254,174,0.1) 0%, transparent 70%)' }} />

      {/* Floating badge */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10">
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '9999px',
          padding: '8px 20px',
          boxShadow: '0 8px 32px rgba(80,112,224,0.15)',
          border: '1px solid rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#59FEAE',
            boxShadow: '0 0 8px #59FEAE',
            display: 'inline-block',
          }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#3050B0' }}>
            Live across 47 Courts in India 🇮🇳
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div>
            <h1
              className="font-display"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 'clamp(40px, 5vw, 64px)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-1px',
                color: 'white',
                marginBottom: '4px',
              }}
            >
              LETESE
              <span style={{ color: '#59FEAE', marginLeft: '4px' }}>●</span>
            </h1>
            <p style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 'clamp(22px, 3vw, 34px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.3,
              marginBottom: '20px',
            }}>
              Legal Practice Suite
            </p>

            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '17px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.7,
              marginBottom: '32px',
              maxWidth: '480px',
            }}>
              Auto-track P&H HC, Delhi HC, SC orders. AI draft petitions in minutes.
              WhatsApp hearing reminders. Built for Indian advocates.
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '36px', flexWrap: 'wrap' }}>
              {[
                { icon: ShieldCheck, text: 'Data encrypted at rest' },
                { icon: Clock, text: '24/7 case monitoring' },
                { icon: CheckCircle2, text: 'Bar Council compliant' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={14} color="#59FEAE" strokeWidth={2.5} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link href="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '16px 32px',
                background: 'white',
                color: '#5070E0',
                borderRadius: '9999px',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700, fontSize: '15px',
                textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}>
                Start Free Trial
                <ArrowRight size={18} />
              </Link>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '16px 32px',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(16px)',
                color: 'white',
                borderRadius: '9999px',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700, fontSize: '15px',
                border: '1.5px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}>
                <Play size={16} fill="white" />
                Watch Demo (2 min)
              </button>
            </div>

            <p style={{
              marginTop: '20px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: 'rgba(255,255,255,0.55)',
            }}>
              No credit card required • 14-day free trial • Setup in 5 minutes
            </p>
          </div>

          {/* Right: Dashboard Preview */}
          <div className="relative hidden lg:block">
            {/* Mock dashboard */}
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(24px)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.8)',
            }}>
              {/* Mock header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF5F56' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFBD2E' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27C93F' }} />
                <div style={{
                  flex: 1, height: '24px', background: 'rgba(80,112,224,0.08)',
                  borderRadius: '8px', marginLeft: '8px',
                  display: 'flex', alignItems: 'center', padding: '0 12px',
                }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#8B92A0' }}>
                    app.letese.xyz
                  </span>
                </div>
              </div>

              {/* Mock content */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[
                  { label: 'Active Cases', value: '47', color: '#5070E0', bg: '#EFF6FF' },
                  { label: 'Hearings Today', value: '3', color: '#F59E0B', bg: '#FFFBEB' },
                ].map(card => (
                  <div key={card.label} style={{
                    background: card.bg, borderRadius: '14px', padding: '14px',
                    border: `1px solid ${card.color}20`,
                  }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: card.color, fontWeight: 600 }}>
                      {card.label}
                    </div>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '22px', fontWeight: 800, color: card.color }}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mock case list */}
              <div style={{ background: '#F8F9FC', borderRadius: '14px', padding: '14px' }}>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '12px', fontWeight: 700, color: '#1A1D26', marginBottom: '10px' }}>
                  Upcoming Hearings
                </div>
                {[
                  { c: 'CWP 1234/2024', ct: 'P&H HC', dt: 'Today, 10:30 AM', st: '#27C93F' },
                  { c: 'SA 456/2023', ct: 'Delhi HC', dt: 'Tomorrow, 2:00 PM', st: '#5070E0' },
                  { c: 'SLP 789/2024', ct: 'Supreme Court', dt: '20 Apr 2025', st: '#F59E0B' },
                ].map(case_ => (
                  <div key={case_.c} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                  }}>
                    <div>
                      <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '12px', fontWeight: 600, color: '#1A1D26' }}>{case_.c}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#8B92A0' }}>{case_.ct}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: case_.st }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#5A6070' }}>{case_.dt}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp reminder mock */}
              <div style={{
                marginTop: '12px', background: '#F0FDF4',
                border: '1px solid #25D36630', borderRadius: '14px', padding: '12px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{ fontSize: '20px' }}>📱</div>
                <div>
                  <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '12px', fontWeight: 600, color: '#1A1D26' }}>
                    Reminder sent to client
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#5A6070' }}>
                    "Hearing tomorrow at 10:30 AM — P&H HC"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Court logos */}
        <div style={{
          marginTop: '60px',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, letterSpacing: '0.5px' }}>
            TRUSTED BY ADVOCATES AT
          </span>
          {['Punjab & Haryana HC', 'Delhi High Court', 'Supreme Court', 'NCDRC', 'District Courts'].map(court => (
            <span key={court} style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.6)',
            }}>
              {court}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
