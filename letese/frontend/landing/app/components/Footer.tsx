'use client'

import { Scale } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  const links = {
    Product: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Security', 'Compliance'],
    Support: ['Documentation', 'API Reference', 'Help Center', 'Status'],
  }

  return (
    <footer style={{
      background: '#1A1D26',
      color: 'rgba(255,255,255,0.85)',
      paddingTop: '72px',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top: Logo + Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr repeat(4, 1fr)',
          gap: '48px',
          marginBottom: '64px',
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #5070E0, #3050B0)',
                padding: '6px 10px',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center',
              }}>
                <Scale className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '18px',
                fontWeight: 800,
                color: 'white',
              }}>LETESE</span>
              <span style={{ color: '#59FEAE', fontWeight: 800, marginTop: '2px' }}>●</span>
            </div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.65,
              maxWidth: '240px',
              marginBottom: '24px',
            }}>
              AI-powered legal management for Indian advocates. Built with ❤️ in India.
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {['Twitter', 'LinkedIn', 'YouTube', 'Instagram'].map((social) => (
                <a key={social} href="#" style={{
                  width: '36px', height: '36px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}>
                  {social[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                color: 'white',
                marginBottom: '16px',
                letterSpacing: '0.5px',
              }}>
                {category.toUpperCase()}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.5)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '28px', paddingBottom: '28px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              color: 'rgba(255,255,255,0.35)',
            }}>
              © {new Date().getFullYear()} LETESE Technologies Pvt. Ltd. All rights reserved.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#59FEAE',
                boxShadow: '0 0 8px #59FEAE',
              }} />
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: 'rgba(255,255,255,0.35)',
              }}>
                All systems operational
              </span>
            </div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: 'rgba(255,255,255,0.25)',
            }}>
              Powered by Lattice Technologies
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
