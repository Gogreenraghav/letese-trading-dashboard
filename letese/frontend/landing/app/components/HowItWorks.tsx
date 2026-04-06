'use client'

import { motion } from 'framer-motion'
import { UserPlus, Settings, Zap } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up in 2 minutes. No credit card required. Invite your team and start onboarding.',
    detail: 'Free 14-day trial, no card needed',
  },
  {
    number: '02',
    icon: Settings,
    title: 'Configure Your Courts',
    description: 'Select your practice courts — P&H HC, Delhi HC, SC, NCLT, DRT. LETESE starts scraping automatically.',
    detail: 'Supports 50+ courts across India',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Run Your Firm Smarter',
    description: 'Cases sync automatically, reminders fire, AI drafts documents, clients stay informed.',
    detail: 'AI handles 40% of admin work',
  },
]

export default function HowItWorks() {
  return (
    <section className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-bg-dark via-bg-dark-3 to-bg-dark" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-brand-purple text-sm font-semibold tracking-wider uppercase">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
            Live in 3 Simple Steps
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            From signup to fully operational in under an hour. No technical skills required.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.5 }}
                  className="relative text-center"
                >
                  {/* Step number */}
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full glass-strong mb-6 relative">
                    <span className="absolute -top-2 -right-2 text-6xl font-bold text-brand-cyan/10">
                      {step.number}
                    </span>
                    <div className="w-16 h-16 rounded-2xl bg-brand-blue/20 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-brand-cyan" strokeWidth={1.8} />
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto mb-3">
                    {step.description}
                  </p>
                  <span className="inline-block text-brand-green text-xs font-medium px-3 py-1 rounded-full glass">
                    {step.detail}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
