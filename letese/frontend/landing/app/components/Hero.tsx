'use client'

import { motion } from 'framer-motion'
import { Play, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Phone mockup screens as inline SVGs (representing app views)
function PhoneMockup() {
  return (
    <div className="phone-mockup w-64 flex-shrink-0">
      <div className="phone-screen">
        {/* Status bar */}
        <div className="bg-bg-dark px-4 py-2 flex justify-between items-center text-xs text-gray-400">
          <span>9:41</span>
          <div className="flex gap-1">
            <span>●●●●</span>
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>
        {/* App header */}
        <div className="bg-brand-blue px-4 py-3">
          <p className="text-white text-xs font-semibold">LETESE</p>
          <p className="text-brand-cyan text-[10px]">Case Diary</p>
        </div>
        {/* Case entries */}
        <div className="px-3 py-3 space-y-2 bg-bg-dark">
          {[
            { case: 'CWP-4567/2024', court: 'P&H HC', date: '15 Apr', status: 'Hearing' },
            { case: 'SLP-123/2024', court: 'Supreme Court', date: '18 Apr', status: 'Listed' },
            { case: 'WPC-789/2024', court: 'Delhi HC', date: '22 Apr', status: 'Pending' },
          ].map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 + 0.5 }}
              className="glass rounded-lg p-2 text-xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium text-[10px]">{c.case}</p>
                  <p className="text-gray-400 text-[9px]">{c.court}</p>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-blue/30 text-brand-cyan">
                  {c.date}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                <span className="text-brand-green text-[8px]">{c.status}</span>
              </div>
            </motion.div>
          ))}
          {/* WhatsApp reminder preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-3 glass rounded-lg p-2"
          >
            <p className="text-[9px] text-gray-400 mb-1">🔔 Reminder</p>
            <div className="bg-green-800/50 rounded-lg rounded-tl-none p-2">
              <p className="text-[9px] text-green-100">
                Hearing tomorrow at 10:00 AM in P&H HC.
                Case: CWP-4567/2024
              </p>
            </div>
          </motion.div>
          {/* AI Draft preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="glass rounded-lg p-2"
          >
            <p className="text-[9px] text-gray-400 mb-1">✏️ AI Draft</p>
            <div className="space-y-1">
              <div className="h-1.5 bg-brand-purple/50 rounded w-full" />
              <div className="h-1.5 bg-brand-purple/30 rounded w-4/5" />
              <div className="h-1.5 bg-brand-purple/30 rounded w-3/5" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="orb orb-blue top-[-200px] left-[-100px]" />
        <div className="orb orb-purple top-[20%] right-[-150px]" />
        <div className="orb orb-cyan bottom-[10%] left-[20%]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-bg-dark via-bg-dark/95 to-bg-dark" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          {/* Left: Text content */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div variants={itemVariants} className="inline-flex">
              <div className="glass rounded-full px-4 py-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                <span className="text-brand-cyan text-xs font-medium">
                  Trusted by 500+ Law Firms across India
                </span>
              </div>
            </motion.div>

            {/* Hero heading */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-white">Legal Practice</span>
                <br />
                <span className="gradient-text">Management,</span>
                <br />
                <span className="text-white">Reimagined</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 max-w-lg">
                Track cases. Automate reminders. Draft faster. Win more.
              </p>
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <Link
                href="https://app.letese.xyz/register"
                className="group flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-light text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-all hover:shadow-xl hover:shadow-brand-blue/30 hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="group flex items-center gap-2 glass text-white hover:text-brand-cyan px-7 py-3.5 rounded-xl font-medium text-base transition-all hover:-translate-y-0.5">
                <Play className="w-4 h-4 fill-current" />
                Watch Demo
              </button>
            </motion.div>

            {/* Stats bar */}
            <motion.div
              variants={itemVariants}
              className="glass-strong rounded-2xl px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {[
                { value: '500+', label: 'Law Firms' },
                { value: '50,000+', label: 'Cases Tracked' },
                { value: '99.9%', label: 'Uptime' },
                { value: '4.8★', label: 'Rating' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-brand-cyan font-bold text-lg sm:text-xl neon-text">
                    {stat.value}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Phone mockup */}
          <motion.div
            variants={itemVariants}
            className="hidden lg:flex justify-center items-center"
          >
            <div className="relative">
              {/* Glow behind phone */}
              <div className="absolute inset-0 bg-brand-blue/20 blur-3xl rounded-full scale-75" />
              <PhoneMockup />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
