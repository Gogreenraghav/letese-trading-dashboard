'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    quote:
      'LETESE ne hamare P&H HC cases automate kar diye. 40% less time on admin. Ab hamare associates case research pe focus kar sakte hain.',
    author: 'Adv. Priya Kapoor',
    role: 'Managing Partner, Kapoor & Associates',
    location: 'Chandigarh',
    rating: 5,
  },
  {
    quote:
      'AI drafting amazing hai. Writ petition 2 ghante mein ready — pehle 2 din lagte the. Compliance checker se technical rejection bhi khtm. Game changer!',
    author: 'Adv. Rajinder Sharma',
    role: 'Senior Advocate',
    location: 'Delhi High Court',
    rating: 5,
  },
  {
    quote:
      'Client reminders WhatsApp pe aate hain. Client satisfaction up 60%. Clients ko lagta hai hum professional hain. ROI excellent hai.',
    author: 'Law Firm ABC',
    role: 'Full-service Law Firm',
    location: 'Ludhiana',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section className="relative py-24" id="testimonials">
      <div className="absolute inset-0 bg-gradient-to-b from-bg-dark via-bg-dark-2 to-bg-dark" />
      {/* Purple glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-purple/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-brand-green text-sm font-semibold tracking-wider uppercase">
            Testimonials
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
            Law Firms Love LETESE
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Real feedback from advocates across Punjab, Haryana, Delhi, and beyond.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="glass card-hover rounded-2xl p-6 flex flex-col"
            >
              {/* Quote icon */}
              <Quote className="w-6 h-6 text-brand-cyan/40 mb-4 flex-shrink-0" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star
                    key={si}
                    className="w-3.5 h-3.5 fill-brand-green text-brand-green"
                  />
                ))}
              </div>

              {/* Quote text */}
              <blockquote className="text-gray-300 text-sm leading-relaxed flex-1 mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-white font-semibold text-sm">{t.author}</p>
                <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
                <p className="text-brand-cyan text-xs mt-1">📍 {t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="glass rounded-full px-6 py-3 inline-flex items-center gap-3">
            <div className="flex -space-x-2">
              {['PK', 'RS', 'ABC', '+497'].map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-brand-blue/40 border-2 border-bg-dark flex items-center justify-center text-[10px] font-bold text-brand-cyan"
                >
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-gray-400 text-sm">
              Join <span className="text-white font-semibold">500+ advocates</span> already using LETESE
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
