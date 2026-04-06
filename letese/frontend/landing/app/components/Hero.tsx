'use client'

import { Scale, Play, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

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
            India's #1 Legal AI Platform
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
                marginBottom: '24px',
              }}
            >
              LETESE
              <span style={{ color: '#59FEAE', marginLeft: '4px' }}>●</span>
            </h1>
            <p style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.3,
              marginBottom: '16px',
            }}>
              Advocate Suite
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '16px',
              color: 'rgba(255,255,255,0.85)',
              marginBottom: '32px',
              lineHeight: 1.7,
            }}>
              वकीलों के लिए AI powered legal management
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.7,
              maxWidth: '480px',
              marginBottom: '40px',
            }}>
              AI-powered case management, instant legal drafting &amp; 24/7 court
              judgment monitoring for Indian advocates. Win more cases with
              intelligent automation.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
              <button style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 32px',
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
              <button
                onClick={() => setPlaying(!playing)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 32px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(16px)',
                  color: 'white',
                  borderRadius: '9999px',
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700,
                  fontSize: '15px',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '36px', height: '36px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Play size={16} fill="white" />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Trust indicators */}
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {[
                'No credit card required',
                '14-day free trial',
                'Cancel anytime',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#59FEAE" />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="hidden lg:flex justify-center">
            <div style={{
              position: 'relative',
              width: '280px',
              height: '580px',
              background: '#0A0E1A',
              borderRadius: '44px',
              padding: '8px',
              boxShadow: '0 40px 80px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.1)',
            }}>
              {/* Phone notch */}
              <div style={{
                position: 'absolute',
                top: '8px', left: '50%', transform: 'translateX(-50%)',
                width: '100px', height: '28px',
                background: '#0A0E1A',
                borderRadius: '0 0 20px 20px',
                zIndex: 10,
              }} />
              {/* Screen */}
              <div style={{
                width: '100%', height: '100%',
                borderRadius: '36px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, #B0C0F0 0%, #5070E0 100%)',
                position: 'relative',
              }}>
                {/* Mock UI */}
                <div style={{ padding: '40px 16px 16px', height: '100%', position: 'relative' }}>
                  {/* Logo mock */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '16px', fontWeight: 800, color: 'white' }}>LETESE</span>
                    <span style={{ color: '#59FEAE', fontWeight: 800 }}>●</span>
                  </div>

                  {/* Status chips */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
                    {[['🔴 Live', '#B41340'], ['🟡 Pending', '#FFB547'], ['🟢 Done', '#59FEAE']].map(([label, color]) => (
                      <div key={label as string} style={{
                        padding: '6px 12px', borderRadius: '20px',
                        background: 'rgba(255,255,255,0.9)',
                        fontSize: '11px', fontWeight: 700,
                        color: color as string,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}>{label as string}</div>
                    ))}
                  </div>

                  {/* Case card */}
                  <div style={{
                    background: 'rgba(255,255,255,0.92)',
                    borderRadius: '16px',
                    padding: '14px',
                    marginBottom: '12px',
                    borderLeft: '4px solid #5070E0',
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#5070E0', marginBottom: '4px' }}>Next Up • Court 4</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A1D26', marginBottom: '4px' }}>State of Maharashtra vs. K. Deshmukh</div>
                    <div style={{ fontSize: '10px', color: '#5A6070', marginBottom: '8px' }}>11:30 AM</div>
                    <div style={{ height: '4px', background: '#E8EBF5', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: '68%', background: '#5070E0', borderRadius: '2px' }} />
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    {[['📝', 'New Case', '#EFF6FF'], ['🤖', 'AI Draft', '#ECFDF5']].map(([icon, label, bg]) => (
                      <div key={label as string} style={{
                        background: bg as string,
                        borderRadius: '12px', padding: '12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      }}>
                        <span style={{ fontSize: '18px' }}>{icon as string}</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#5070E0' }}>{label as string}</span>
                      </div>
                    ))}
                  </div>

                  {/* AIPOT preview */}
                  <div style={{
                    background: 'rgba(255,255,255,0.92)',
                    borderRadius: '16px', padding: '14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#1A1D26' }}>⚡ AIPOT Live</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#B41340', background: 'rgba(180,19,64,0.1)', padding: '2px 8px', borderRadius: '10px' }}>● LIVE</span>
                    </div>
                    {['🏛️ Landmark Ruling Digital Privacy', '⚖️ Amendment Corporate Insolvency', '⚖️ Tenant Protection Act 2024'].map((text, i) => (
                      <div key={i} style={{
                        background: '#F8FAFF', borderRadius: '8px', padding: '8px', marginBottom: '6px',
                        fontSize: '9px', color: '#5A6070',
                      }}>{text}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
