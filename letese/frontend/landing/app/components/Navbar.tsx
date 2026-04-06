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
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Scale className="w-7 h-7 text-brand-blue" strokeWidth={2.5} />
            <span className="text-xl font-bold text-brand-blue">LETESE</span>
            <span className="text-brand-green font-bold text-lg">●</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://app.letese.xyz"
              className="bg-brand-blue hover:bg-brand-blue-light text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand-blue/30"
            >
              Open App
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-gray-300 hover:text-white text-sm"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://app.letese.xyz"
              className="mt-2 block text-center bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Open App
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
