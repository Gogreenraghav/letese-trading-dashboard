'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 via-bg-dark to-brand-purple/20" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-[-100px] left-[10%] w-[400px] h-[400px] rounded-full bg-brand-cyan/10 blur-[100px]" />
      <div className="absolute bottom-[-100px] right-[10%] w-[400px] h-[400px] rounded-full bg-brand-purple/10 blur-[100px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Tag */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8">
            <Calendar className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="text-brand-cyan text-xs font-medium">
              Limited: 3 months free on annual billing
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Ready to Transform
            <br />
            <span className="gradient-text">Your Legal Practice?</span>
          </h2>

          <p className="mt-6 text-gray-400 text-lg max-w-2xl mx-auto">
            Join 500+ law firms already saving 40% on admin time. Start your free 14-day trial today — no credit card required.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="https://app.letese.xyz/register"
              className="group flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-light text-white px-8 py-4 rounded-xl font-bold text-base transition-all hover:shadow-2xl hover:shadow-brand-blue/40 hover:-translate-y-1"
            >
              Start Free Trial — No Card Needed
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="mailto:info@letese.xyz"
              className="flex items-center gap-2 glass text-white hover:text-brand-cyan px-8 py-4 rounded-xl font-medium text-base transition-all hover:-translate-y-1"
            >
              Talk to Sales
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-gray-500 text-xs">
            {[
              '✓ No credit card required',
              '✓ 14-day free trial',
              '✓ Setup in 30 minutes',
              '✓ Cancel anytime',
            ].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
