'use client'

import { motion } from 'framer-motion'
import {
  Search, Bell, FileText, Users, CreditCard, BarChart3,
  Globe, Inbox, ShieldCheck, Smartphone, Lock, Sparkles
} from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'Court Case Tracker',
    description: 'Real-time scraping from P&H HC, Delhi HC, Supreme Court & 50+ courts. Never miss a listing.',
    color: '#00D4FF',
  },
  {
    icon: Bell,
    title: 'Hearing Reminders',
    description: 'WhatsApp + SMS reminders automated before hearings. Multi-language client notifications.',
    color: '#22C55E',
  },
  {
    icon: Sparkles,
    title: 'AI Document Drafting',
    description: 'GPT-4o powered legal drafts — writ petitions, replies, plaints in minutes, not hours.',
    color: '#8B5CF6',
  },
  {
    icon: FileText,
    title: 'Live Document Editor',
    description: 'Real-time collaboration for 3+ users simultaneously. Auto-save, version history, e-filing.',
    color: '#F59E0B',
  },
  {
    icon: Users,
    title: 'Multi-User RBAC',
    description: 'Granular roles — Partner, Associate, Paralegal. Full audit trail for every action.',
    color: '#3B82F6',
  },
  {
    icon: CreditCard,
    title: 'Smart Billing',
    description: 'Razorpay-powered invoices, payment links, UPI/gateway collection, automated receipts.',
    color: '#10B981',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'AI usage stats, costs, lawyer activity, case pipeline. Data-driven firm management.',
    color: '#EC4899',
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Punjabi, Hindi, English — full UI and document support. Reach every client in their language.',
    color: '#F97316',
  },
  {
    icon: Inbox,
    title: 'Unified Inbox',
    description: 'WhatsApp + Email in one place. Client communication linked directly to case files.',
    color: '#06B6D4',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Checker',
    description: 'Auto-validates documents against court rules. Never face rejection for technical errors.',
    color: '#84CC16',
  },
  {
    icon: Smartphone,
    title: 'Mobile App',
    description: 'Flutter-powered iOS + Android app. Manage your firm from anywhere, anytime.',
    color: '#A855F7',
  },
  {
    icon: Lock,
    title: 'Bank-Level Security',
    description: 'AES-256 encryption, tenant isolation, SOC 2 compliant. Your data stays yours.',
    color: '#0EA5E9',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function FeaturesGrid() {
  return (
    <section className="relative py-24" id="features">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-dark via-bg-dark-2 to-bg-dark" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-brand-cyan text-sm font-semibold tracking-wider uppercase">
              Powerful Features
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
              Everything Your Firm Needs
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-lg">
              12 integrated tools built specifically for Indian law firms — from case tracking to AI drafting.
            </p>
          </motion.div>
        </div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                className="glass card-hover rounded-xl p-5 group cursor-default"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}20`, border: `1px solid ${feature.color}40` }}
                >
                  <Icon className="w-5 h-5" style={{ color: feature.color }} strokeWidth={1.8} />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
