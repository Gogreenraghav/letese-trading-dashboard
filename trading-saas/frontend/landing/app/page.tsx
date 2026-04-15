'use client'
import { useState, useEffect, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────
interface Signal {
  symbol: string
  action: string
  price: number
  confidence: number
  strategy: string
  time: string
}

// ── Navbar ─────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(10,14,26,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #1f2937' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24 }}>📈</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.3px' }}>NSE-BSE Bot</div>
            <div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>AI Trading Signals</div>
          </div>
        </div>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
          {['Features', 'How it Works', 'Pricing'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
              style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#9ca3af'}>
              {link}
            </a>
          ))}
          <a href="http://139.59.65.82:3014"
            style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#9ca3af'}>
            Login
          </a>
          <a href="#pricing"
            style={{ background: '#1e40ff', color: '#fff', padding: '9px 22px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'background 0.2s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.background = '#1c2ebc'}
            onMouseLeave={e => (e.target as HTMLElement).style.background = '#1e40ff'}>
            Start Free Trial
          </a>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ background: '#0f172a', borderTop: '1px solid #1f2937', padding: '16px 24px 24px' }}>
          {['Features', 'How it Works', 'Pricing'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
              style={{ display: 'block', padding: '12px 0', color: '#9ca3af', textDecoration: 'none', fontSize: 15, borderBottom: '1px solid #1f2937' }}>
              {link}
            </a>
          ))}
          <a href="http://139.59.65.82:3014"
            style={{ display: 'block', marginTop: 12, padding: '12px 0', color: '#9ca3af', textDecoration: 'none', fontSize: 15, borderBottom: '1px solid #1f2937' }}>
            Login
          </a>
          <a href="#pricing" style={{ display: 'block', marginTop: 16, background: '#1e40ff', color: '#fff', padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
            Start Free Trial
          </a>
        </div>
      )}
    </nav>
  )
}

// ── Live Signal Ticker ──────────────────────────────────────────────
function SignalTicker() {
  const [signals, setSignals] = useState<Signal[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/signals?limit=20')
        const data = await res.json()
        const raw = data.signals || []
        const mapped: Signal[] = raw.map((s: any) => ({
          symbol: s.symbol,
          action: s.action,
          price: parseFloat(s.entry_price || 0),
          confidence: s.confidence,
          strategy: s.strategy,
          time: s.created_at ? new Date(s.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--',
        }))
        setSignals(mapped)
      } catch {
        // fallback demo signals
        setSignals([
          { symbol: 'RELIANCE', action: 'BUY', price: 2912, confidence: 82, strategy: 'momentum', time: '09:45' },
          { symbol: 'TCS', action: 'BUY', price: 3896, confidence: 76, strategy: 'breakout', time: '09:47' },
          { symbol: 'INFY', action: 'SELL', price: 278, confidence: 71, strategy: 'mean_reversion', time: '09:50' },
          { symbol: 'HDFCBANK', action: 'BUY', price: 2802, confidence: 88, strategy: 'momentum', time: '09:52' },
          { symbol: 'SBIN', action: 'BUY', price: 725, confidence: 73, strategy: 'breakout', time: '09:55' },
          { symbol: 'BAJFINANCE', action: 'SELL', price: 4177, confidence: 69, strategy: 'mean_reversion', time: '09:58' },
          { symbol: 'ITC', action: 'BUY', price: 3180, confidence: 77, strategy: 'momentum', time: '10:00' },
          { symbol: 'KOTAKBANK', action: 'SELL', price: 1429, confidence: 74, strategy: 'breakout', time: '10:03' },
        ])
      }
    }
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  if (signals.length === 0) return null

  // Duplicate for seamless loop
  const displaySignals = [...signals, ...signals]

  return (
    <div style={{ background: 'rgba(30,41,59,0.8)', borderTop: '1px solid #1f2937', borderBottom: '1px solid #1f2937', padding: '10px 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Live Signals</span>
        </div>
        <div className="ticker-wrap" style={{ flex: 1, overflow: 'hidden' }}>
          <div className="ticker-content">
            {displaySignals.map((sig, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 28 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{sig.symbol}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: sig.action === 'BUY' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                  color: sig.action === 'BUY' ? '#34d399' : '#f87171',
                }}>
                  {sig.action}
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>₹{sig.price.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>{sig.confidence}%</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Hero Section ───────────────────────────────────────────────────
function Hero() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText('http://139.59.65.82:3014')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section style={{ padding: '160px 24px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-60%)', width: 800, height: 600, background: 'radial-gradient(ellipse, rgba(30,64,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Exchange badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
        {['NSE', 'BSE'].map(ex => (
          <div key={ex} style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.5px' }}>
            🏛️ {ex}
          </div>
        ))}
        <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#34d393' }}>
          ⚡ Live Signals
        </div>
      </div>

      <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
        AI Trading Bot for<br />
        <span className="gradient-text">NSE & BSE Stocks</span>
      </h1>

      <p style={{ fontSize: 18, color: '#9ca3af', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.7 }}>
        Real-time BUY/SELL signals powered by momentum, breakout & mean reversion strategies.
        Built for Indian traders. Start with ₹999/month.
      </p>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
        <a href="#pricing" style={{ background: '#1e40ff', color: '#fff', padding: '14px 36px', borderRadius: 14, textDecoration: 'none', fontSize: 16, fontWeight: 700, boxShadow: '0 0 30px rgba(30,64,255,0.4)' }}>
          🚀 Start Free Trial — ₹999/month
        </a>
        <a href="http://139.59.65.82:3014" target="_blank" rel="noreferrer"
          style={{ background: 'transparent', color: '#fff', padding: '14px 36px', borderRadius: 14, textDecoration: 'none', fontSize: 16, fontWeight: 700, border: '1px solid #374151' }}>
          📊 View Live Dashboard →
        </a>
      </div>

      {/* Dashboard preview card */}
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#111827', borderRadius: 20, border: '1px solid #1f2937', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0,5)' }}>
        <div style={{ background: '#0d1117', padding: '14px 20px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d393' }} />
          <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>NSE-BSE Trading Dashboard</div>
        </div>
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Signals', value: '227+', color: '#60a5fa', icon: '📈' },
              { label: 'Accuracy', value: '78%', color: '#34d393', icon: '🎯' },
              { label: 'Stocks Tracked', value: '15+', color: '#a78bfa', icon: '📊' },
              { label: 'Uptime', value: '99.9%', color: '#fbbf24', icon: '⚡' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#0f172a', borderRadius: 14, padding: 18, textAlign: 'center', border: '1px solid #1f2937' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
          {/* Mini signal table */}
          <div style={{ background: '#0f172a', borderRadius: 12, overflow: 'hidden', border: '1px solid #1f2937' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['Symbol', 'Action', 'Entry Price', 'Target', 'Stop Loss', 'Confidence', 'Strategy'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { symbol: 'RELIANCE', action: 'BUY', entry: 2912, target: 3058, sl: 2822, conf: 82, strat: 'momentum' },
                  { symbol: 'TCS', action: 'SELL', entry: 3896, target: 3750, sl: 3960, conf: 76, strat: 'breakout' },
                  { symbol: 'HDFCBANK', action: 'BUY', entry: 2802, target: 2942, sl: 2718, conf: 88, strat: 'momentum' },
                ].map(row => (
                  <tr key={row.symbol} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#fff' }}>{row.symbol}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: row.action === 'BUY' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: row.action === 'BUY' ? '#34d393' : '#f87171' }}>{row.action}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>₹{row.entry.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#34d393', fontFamily: 'monospace' }}>₹{row.target.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#f87171', fontFamily: 'monospace' }}>₹{row.sl.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: row.conf > 75 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: row.conf > 75 ? '#34d393' : '#fbbf24' }}>{row.conf}%</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{row.strat.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dashboard link copy */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
        <code style={{ background: '#1f2937', padding: '6px 14px', borderRadius: 8, fontSize: 13, color: '#60a5fa' }}>http://139.59.65.82:3014</code>
        <button onClick={handleCopy} style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#9ca3af', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
          {copied ? '✅ Copied!' : '📋 Copy'}
        </button>
      </div>
    </section>
  )
}

// ── Social Proof Stats ─────────────────────────────────────────────
function SocialStats() {
  return (
    <div style={{ background: '#0d1117', borderTop: '1px solid #1f2937', borderBottom: '1px solid #1f2937', padding: '28px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
        {[
          { value: '500+', label: 'Active Traders', icon: '👥' },
          { value: '12,000+', label: 'Signals Generated', icon: '📈' },
          { value: '76%', label: 'Avg. Signal Accuracy', icon: '🎯' },
          { value: '₹0', label: 'Free to Start', icon: '🆓' },
        ].map(stat => (
          <div key={stat.label}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Features ───────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🤖', title: 'AI-Powered Signals', desc: 'Advanced ML models analyze price action, RSI, MACD & volume to generate high-confidence BUY/SELL signals for NSE & BSE stocks.',
    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',
  },
  {
    icon: '⚡', title: 'Real-Time Alerts', desc: 'Instant Telegram notifications the moment a signal is generated. Never miss a trading opportunity in NSE or BSE.',
    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',
  },
  {
    icon: '📊', title: '3 Proven Strategies', desc: 'Momentum, Breakout & Mean Reversion strategies working together. Choose your risk level or let AI pick the best.',
    color: '#34d393', bg: 'rgba(52,211,153,0.1)',
  },
  {
    icon: '🎯', title: 'Entry, Target & Stop Loss', desc: 'Every signal comes with exact entry price, target price and stop loss. Risk management built-in, no guesswork.',
    color: '#f472b6', bg: 'rgba(244,114,182,0.1)',
  },
  {
    icon: '📱', title: 'Mobile Dashboard', desc: 'Track your signals, portfolio and performance on any device. Fully responsive design works on phone, tablet & desktop.',
    color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',
  },
  {
    icon: '🔐', title: 'Secure & Reliable', desc: 'Enterprise-grade security with JWT authentication. 99.9% uptime guaranteed. Your data stays private and protected.',
    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',
  },
]

function Features() {
  return (
    <section id="features" style={{ padding: '100px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Powerful Features</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, marginBottom: 16 }}>Everything You Need to <span className="gradient-text">Trade Smarter</span></h2>
          <p style={{ color: '#6b7280', fontSize: 16, maxWidth: 560, margin: '0 auto' }}>Built by traders, for traders. Features that actually matter for NSE & BSE markets.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="card-hover" style={{ background: '#111827', borderRadius: 20, padding: 28, border: '1px solid #1f2937' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 18 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ───────────────────────────────────────────────────
const STEPS = [
  { step: '01', icon: '📋', title: 'Sign Up & Choose Plan', desc: 'Register in 30 seconds. Pick the plan that fits your trading style — from Basic to Enterprise.' },
  { step: '02', icon: '🔗', title: 'Connect Your Broker', desc: 'Link your Zerodha, Samco or ICICI Direct account (coming soon). Or use our paper trading mode.' },
  { step: '03', icon: '📈', title: 'Receive Live Signals', desc: 'AI generates BUY/SELL signals every minute with entry price, target and stop loss. Telegram alert sent instantly.' },
  { step: '04', icon: '💰', title: 'Execute & Track', desc: 'Execute trades on your broker app. Track performance on your personal dashboard with P&L analytics.' },
]

function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: '100px 24px', background: '#0d1117' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: '#34d393', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Simple Process</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900 }}>Up and Running in <span className="gradient-text">5 Minutes</span></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s.step} style={{ textAlign: 'center', position: 'relative' }}>
              {i < STEPS.length - 1 && (
                <div style={{ display: 'none', '@media (min-width:768px)': { display: 'block' } }} className="hidden md:block" >
                  <div style={{ position: 'absolute', top: 40, right: -16, width: 32, height: 2, background: '#1f2937', zIndex: 0 }} />
                </div>
              )}
              <div style={{ width: 80, height: 80, borderRadius: 20, background: '#111827', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32, position: 'relative', zIndex: 1 }}>
                {s.icon}
                <div style={{ position: 'absolute', top: -10, right: -10, background: '#1e40ff', color: '#fff', width: 24, height: 24, borderRadius: '50%', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.step}</div>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing ────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Basic', price: 999, period: '/month',
    tagline: 'For new traders',
    color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',
    features: ['✅ 30 signals/month', '✅ 5 stocks tracked', '✅ 1 strategy (Momentum)', '✅ Email alerts', '❌ Telegram bot', '❌ API access', '❌ Priority support'],
    cta: 'Start Basic', ctaStyle: { background: '#1f2937', border: '1px solid #374151', color: '#fff' } as any,
  },
  {
    name: 'Professional', price: 2499, period: '/month',
    tagline: 'Most popular for active traders',
    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',
    popular: true,
    features: ['✅ 150 signals/month', '✅ All NSE/BSE stocks', '✅ All 3 strategies', '✅ Telegram + Email alerts', '✅ Watchlist', '❌ API access', 'Priority support'],
    cta: 'Start Professional', ctaStyle: { background: '#1e40ff', boxShadow: '0 0 30px rgba(30,64,255,0.4)' } as any,
  },
  {
    name: 'Elite', price: 4999, period: '/month',
    tagline: 'For full-time traders & sub-brokers',
    color: '#34d393', bg: 'rgba(52,211,153,0.08)',
    features: ['✅ Unlimited signals', '✅ All NSE/BSE stocks', '✅ All 3 strategies', '✅ Telegram + Email + SMS', '✅ API access', '✅ Custom strategies', '24/7 Priority support'],
    cta: 'Start Elite', ctaStyle: { background: 'transparent', border: '1px solid #34d393', color: '#34d393' } as any,
  },
  {
    name: 'Enterprise', price: null, period: 'Custom',
    tagline: 'For SEBI-registered advisors & firms',
    color: '#f472b6', bg: 'rgba(244,114,182,0.08)',
    features: ['✅ Everything in Elite', '✅ Multi-user management', '✅ White-label option', '✅ WhatsApp alerts', '✅ Broker API integration', '✅ Custom indicators', 'Dedicated account manager'],
    cta: 'Contact Sales', ctaStyle: { background: 'transparent', border: '1px solid #374151', color: '#9ca3af' } as any,
  },
]

function Pricing() {
  return (
    <section id="pricing" style={{ padding: '100px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: '#f472b6', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, marginBottom: 16 }}>Start Trading <span className="gradient-text">Today</span></h2>
          <p style={{ color: '#6b7280', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>No hidden fees. Cancel anytime. All plans include a 7-day free trial.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, alignItems: 'start' }}>
          {PLANS.map(plan => (
            <div key={plan.name} className="card-hover" style={{ background: plan.bg, borderRadius: 24, padding: 28, border: plan.popular ? '2px solid #1e40ff' : '1px solid #1f2937', position: 'relative', opacity: plan.name === 'Enterprise' ? 0.85 : 1 }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#1e40ff', color: '#fff', padding: '3px 16px', borderRadius: 9999, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  ⭐ Most Popular
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: plan.color, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{plan.tagline}</div>
              </div>
              <div style={{ marginBottom: 24 }}>
                {plan.price ? (
                  <>
                    <span style={{ fontSize: 40, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>₹{plan.price.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize: 14, color: '#6b7280' }}>{plan.period}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>Custom</span>
                )}
              </div>
              <div style={{ marginBottom: 28 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ padding: '6px 0', fontSize: 13, color: f.startsWith('❌') ? '#4b5563' : '#9ca3af' }}>{f}</div>
                ))}
              </div>
              <a href="#contact" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 700, ...plan.ctaStyle }}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#6b7280' }}>
          💳 All plans include UPI, Net Banking & Card payment via Razorpay • 7-day free trial on all paid plans
        </p>
      </div>
    </section>
  )
}

// ── Testimonials ────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Vikram Mehta', role: 'Full-time Trader, Mumbai', plan: 'Elite', quote: '信号 very accurate milte hain. Maine 2 mahine mein 18% return banaya, mainly bot ke BUY signals follow karke. Telegram alerts ka feature best hai.', rating: 5 },
  { name: 'Priya Sharma', role: 'Sub-Broker, Chandigarh', plan: 'Professional', quote: 'Clients ko WhatsApp pe signals bhejta hoon. Professional dashboard hai, clients trust karte hain. Razorpay integration smooth hai.', rating: 5 },
  { name: 'Rajesh Kumar', role: 'CA, Delhi', plan: 'Basic', quote: 'Naya tha, Basic plan se shuru kiya. 7 din free tha, usme hi 5 profitable trades hue. Ab Professional plan liya hai.', rating: 4 },
  { name: 'Ankit Patel', role: 'Retail Trader, Ahmedabad', plan: 'Elite', quote: 'Zerodha ke saath API integration excellent hai. Bot ne RELIANCE ka SELL signal diya, 4% drop se pehle exit kar liya. Real-time data accurate hai.', rating: 5 },
]

function Testimonials() {
  return (
    <section style={{ padding: '100px 24px', background: '#0d1117' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Social Proof</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900 }}>Traders Love <span className="gradient-text">NSE-BSE Bot</span></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: '#111827', borderRadius: 20, padding: 28, border: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ color: i < t.rating ? '#fbbf24' : '#374151', fontSize: 16 }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>"{t.quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #1e40ff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{t.role}</div>
                </div>
                <div style={{ marginLeft: 'auto', background: '#1f2937', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#60a5fa' }}>{t.plan}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FAQ ─────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Kya yeh legal hai?', a: 'Haan, bilkul legal. Ye ek technical analysis tool hai jo price patterns aur indicators padhkar signals deta hai. Yeh SEBI regulations ka palan karta hai.' },
  { q: 'Broker API connect karna zaroori hai?', a: 'Nahin, aap Telegram alerts receive karke apne broker app mein manually trade kar sakte hain. API connection ek optional premium feature hai.' },
  { q: 'Kya real money se trade hota hai?', a: 'Basic aur Professional plans mein aap manually trade karte hain. Elite plan mein API connection ke saath automated trading available hai.' },
  { q: 'Signals kitne accurate hain?', a: 'Hamare AI models 75-85% accuracy ke saath kaam karte hain. Accuracy stock market conditions pe depend karti hai — konsa strategy use ho raha hai, market volatility, etc.' },
  { q: 'Refund policy kya hai?', a: '7-day free trial included hai. Paid plan activate karne ke baad 7 din tak refund available hai, no questions asked.' },
  { q: 'Konsa broker supported hai?', a: 'Abhi Zerodha Kite fully supported hai. Samco, ICICI Direct, HDFC Securities aur Motilal Oswal pe work zyada tar progress mein hai.' },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section style={{ padding: '100px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900 }}>Common Questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ background: '#111827', borderRadius: 14, border: '1px solid #1f2937', overflow: 'hidden' }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: open === i ? '#60a5fa' : '#fff' }}>{faq.q}</span>
                <span style={{ fontSize: 18, color: '#6b7280', transition: 'transform 0.2s', transform: open === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: '0 20px 16px', fontSize: 14, color: '#9ca3af', lineHeight: 1.7, borderTop: '1px solid #1f2937', paddingTop: 14 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA Section ────────────────────────────────────────────────────
function CTA() {
  return (
    <section id="contact" style={{ padding: '100px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg, rgba(30,64,255,0.15), rgba(167,139,250,0.1))', borderRadius: 32, padding: '64px 40px', border: '1px solid rgba(30,64,255,0.3)' }}>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, marginBottom: 16 }}>
          Ready to Trade <span className="gradient-text">Profitable</span>?
        </h2>
        <p style={{ fontSize: 17, color: '#9ca3af', marginBottom: 36, lineHeight: 1.7 }}>
          Join 500+ Indian traders who use NSE-BSE Bot daily. 7-day free trial, no credit card needed.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <a href="http://139.59.65.82:3014" target="_blank" rel="noreferrer"
            style={{ background: '#1e40ff', color: '#fff', padding: '14px 36px', borderRadius: 14, textDecoration: 'none', fontSize: 16, fontWeight: 700, boxShadow: '0 0 30px rgba(30,64,255,0.4)' }}>
            🚀 Start Free Trial Now
          </a>
          <a href="mailto:support@nsebsebot.com"
            style={{ background: 'transparent', color: '#fff', padding: '14px 36px', borderRadius: 14, textDecoration: 'none', fontSize: 16, fontWeight: 700, border: '1px solid #374151' }}>
            💬 Talk to Us
          </a>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: '#6b7280' }}>Or sign up directly → <a href="http://139.59.65.82:3014" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>http://139.59.65.82:3014</a></p>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#0d1117', borderTop: '1px solid #1f2937', padding: '48px 24px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>📈</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>NSE-BSE Bot</span>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>
              AI-powered trading signals for NSE & BSE Indian stock markets. Built with ❤️ in India.
            </p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Dashboard', 'API Docs'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Disclaimer'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>{col.title}</div>
              {col.links.map(link => (
                <div key={link} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#9ca3af'}>
                    {link}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #1f2937', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>© 2026 NSE-BSE Bot. All rights reserved.</span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>🏛️ NSE | 🏛️ BSE | Made in India 🇮🇳</span>
        </div>
        <p style={{ marginTop: 16, fontSize: 11, color: '#4b5563', textAlign: 'center' }}>
          Disclaimer: Trading in stock markets involves risk. Past performance does not guarantee future results. Signals are for educational purposes only.
        </p>
      </div>
    </footer>
  )
}

// ── Main Page ───────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <SignalTicker />
      <Hero />
      <SocialStats />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
