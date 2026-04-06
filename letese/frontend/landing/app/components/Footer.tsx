import Link from 'next/link'
import { Scale, Twitter, Linkedin, MessageCircle, Mail } from 'lucide-react'

const footerLinks = {
  Product: [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: 'https://app.letese.xyz', label: 'App Login' },
    { href: 'https://app.letese.xyz/register', label: 'Free Trial' },
  ],
  Company: [
    { href: '#', label: 'About Us' },
    { href: '#', label: 'Blog' },
    { href: '#', label: 'Careers' },
    { href: 'mailto:info@letese.xyz', label: 'Contact' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/security', label: 'Security' },
    { href: '/compliance', label: 'Compliance' },
  ],
  Support: [
    { href: '#', label: 'Documentation' },
    { href: '#', label: 'Help Center' },
    { href: '#', label: 'Community' },
    { href: '#', label: 'Status Page' },
  ],
}

const socials = [
  { icon: Twitter, href: 'https://twitter.com/letese_xyz', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/letese', label: 'LinkedIn' },
  { icon: MessageCircle, href: 'https://wa.me/919876543210', label: 'WhatsApp' },
  { icon: Mail, href: 'mailto:info@letese.xyz', label: 'Email' },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Scale className="w-6 h-6 text-brand-blue" strokeWidth={2.5} />
              <span className="text-lg font-bold text-brand-blue">LETESE</span>
              <span className="text-brand-green font-bold text-sm">●</span>
            </Link>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              AI-powered legal practice management SaaS for Indian law firms. Track cases, automate reminders, draft faster.
            </p>
            <div className="mt-5 flex gap-3">
              {socials.map((social, i) => {
                const Icon = social.icon
                return (
                  <a
                    key={i}
                    href={social.href}
                    aria-label={social.label}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-brand-cyan transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} LETESE Legal Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
