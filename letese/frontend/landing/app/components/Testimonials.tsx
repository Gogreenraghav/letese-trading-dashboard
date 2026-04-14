'use client'

const testimonials = [
  {
    name: 'Advocate Priya Sharma',
    court: 'Delhi High Court',
    location: 'New Delhi',
    plan: 'Elite Plan',
    quote: "Before LETESE, I used to manually check P&H HC website every morning. Now I get WhatsApp alerts the night before. The AI drafting for bail applications saves me 3-4 hours per case. My juniors love the collaborative editor.",
    avatar: 'PS',
    color: '#EFF6FF',
    accent: '#5070E0',
    cases: '120+',
  },
  {
    name: 'Advocate Rajesh Mehta',
    court: 'Punjab & Haryana High Court',
    location: 'Chandigarh',
    plan: 'Professional Plan',
    quote: "The court scraping is what hooked me. LETESE pulls every new order from P&H HC and SC within minutes. My clients get WhatsApp updates automatically — I don't need a clerk for this anymore. Worth every rupee.",
    avatar: 'RM',
    color: '#ECFDF5',
    accent: '#059669',
    cases: '65+',
  },
  {
    name: 'Advocate Sneha Kapoor',
    court: 'NCDRC, New Delhi',
    location: 'Delhi',
    plan: 'Professional Plan',
    quote: "I handle 40+ consumer cases simultaneously. LETESE's case diary with date reminders means I never miss a hearing. The invoice generation alone saves me 2 hours of admin work every week.",
    avatar: 'SK',
    color: '#F5F3FF',
    accent: '#7C3AED',
    cases: '43+',
  },
  {
    name: 'Advocate Amit Gupta',
    court: 'Supreme Court of India',
    location: 'New Delhi',
    plan: 'Elite Plan',
    quote: "The AI drafting for SLPs is surprisingly accurate. It drafts the petition skeleton in under a minute. I review and refine — which is what a senior advocate should be doing anyway. Game changer for throughput.",
    avatar: 'AG',
    color: '#FFF7ED',
    accent: '#EA580C',
    cases: '200+',
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
            ⭐ 247+ ADVOCATES TRUST US
          </span>
          <h2 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#1A1D26',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            What Advocates Are Saying
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '16px',
            color: '#5A6070',
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            Real advocates across Supreme Court, High Courts, and Tribunals using LETESE daily.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {testimonials.map((t) => (
            <div key={t.name} style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px)',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 4px 24px rgba(80,112,224,0.08)',
              position: 'relative',
            }}>
              {/* Stars + Plan badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map((i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#FFB547">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span style={{
                  background: t.accent + '15',
                  color: t.accent,
                  border: `1px solid ${t.accent}30`,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {t.plan}
                </span>
              </div>

              {/* Quote */}
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#1A1D26',
                lineHeight: 1.75,
                marginBottom: '24px',
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
                    {t.court} • {t.location}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '18px', fontWeight: 800, color: t.accent }}>
                    {t.cases}
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#8B92A0' }}>
                    cases handled
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div style={{
          marginTop: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          flexWrap: 'wrap',
          padding: '28px',
          background: 'rgba(255,255,255,0.88)',
          borderRadius: '20px',
          border: '1px solid rgba(80,112,224,0.1)',
        }}>
          {[
            { value: '247+', label: 'Active Advocates' },
            { value: '12,000+', label: 'Cases Tracked' },
            { value: '50,000+', label: 'AI Drafts' },
            { value: '47', label: 'Courts Covered' },
            { value: '99.9%', label: 'Uptime' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '24px',
                fontWeight: 800,
                color: '#5070E0',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#8B92A0',
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
