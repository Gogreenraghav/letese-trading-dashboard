'use client'

const testimonials = [
  {
    name: 'Advocate Priya Sharma',
    court: 'Delhi High Court',
    quote: "LETESE has completely transformed how I manage my practice. The AI drafting saves me 4 hours every day. The AIPOT feed alone is worth the subscription.",
    avatar: 'PS',
    color: '#EFF6FF',
    accent: '#5070E0',
  },
  {
    name: 'Advocate Rajesh Mehta',
    court: 'Punjab & Haryana High Court',
    quote: "Finally, an app built specifically for Indian lawyers. The WhatsApp integration keeps my clients updated without me chasing them. Highly recommended!",
    avatar: 'RM',
    color: '#ECFDF5',
    accent: '#059669',
  },
  {
    name: 'Advocate Ankit Gupta',
    court: 'Supreme Court of India',
    quote: "The collaborative editing feature is a game-changer for multi-party drafting. My team works seamlessly across cities. Worth every rupee.",
    avatar: 'AG',
    color: '#F5F3FF',
    accent: '#7C3AED',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" style={{ padding: '100px 0', background: 'linear-gradient(180deg, #F0F3FA 0%, #EBEFFF 100%)' }}>
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
            ⭐ ADVOCATES LOVE US
          </span>
          <h2 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#1A1D26',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            Trusted by Advocates Across India
          </h2>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {testimonials.map((t) => (
            <div key={t.name} style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '24px',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 4px 24px rgba(80,112,224,0.08)',
            }}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: '2px', marginBottom: '20px' }}>
                {[1,2,3,4,5].map((i) => (
                  <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#FFB547">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                color: '#1A1D26',
                lineHeight: 1.7,
                marginBottom: '24px',
                fontStyle: 'italic',
              }}>
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px',
                  background: t.accent,
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'white',
                }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1A1D26',
                  }}>
                    {t.name}
                  </div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#8B92A0',
                  }}>
                    {t.court}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logos */}
        <div style={{
          marginTop: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '48px',
          flexWrap: 'wrap',
          opacity: 0.4,
        }}>
          {['Supreme Court', 'High Courts', 'Tribunals', 'Law Firms', 'Corporate Legal'].map((item) => (
            <span key={item} style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              color: '#5A6070',
              letterSpacing: '0.5px',
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
