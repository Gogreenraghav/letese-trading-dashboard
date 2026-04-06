'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Scale, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '#testimonials', label: 'Reviews' },
    { href: 'mailto:info@letese.xyz', label: 'Contact' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.7)',
      boxShadow: '0 2px 16px rgba(80,112,224,0.06)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div style={{
              background: 'linear-gradient(135deg, #5070E0, #3050B0)',
              padding: '6px 10px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <Scale className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '20px',
              fontWeight: 800,
              color: '#5070E0',
              letterSpacing: '-0.5px',
            }}>LETESE</span>
            <span style={{
              color: '#59FEAE',
              fontWeight: 800,
              fontSize: '16px',
              marginTop: '2px',
            }}>●</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#5A6070',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#5070E0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#5A6070'}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login" style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: '#5A6070',
              textDecoration: 'none',
            }}>
              Log in
            </Link>
            <Link href="/register" style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #5070E0, #3050B0)',
              color: 'white',
              padding: '10px 22px',
              borderRadius: '9999px',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(80,112,224,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
            }}>
              Start Free Trial →
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl"
            style={{ color: '#5070E0' }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden" style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(80,112,224,0.1)',
          padding: '16px',
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block',
                padding: '12px 0',
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                fontWeight: 500,
                color: '#5A6070',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(80,112,224,0.08)',
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Link href="/login" style={{
              flex: 1, textAlign: 'center', padding: '12px',
              borderRadius: '9999px', border: '1.5px solid #5070E0',
              fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: '#5070E0', textDecoration: 'none',
            }}>Log in</Link>
            <Link href="/register" style={{
              flex: 1, textAlign: 'center', padding: '12px',
              borderRadius: '9999px', background: 'linear-gradient(135deg, #5070E0, #3050B0)',
              fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: 'white', textDecoration: 'none',
            }}>Start Free →</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
