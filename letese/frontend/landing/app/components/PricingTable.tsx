'use client'

import { motion } from 'framer-motion'
import { Check, X, Zap } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Basic',
    price: '₹999',
    period: '/month',
    description: 'For solo advocates starting out',
    cta: 'Start Free Trial',
    highlight: false,
    features: {
      'Active Cases': '30',
      'Storage': '5 GB',
      'Users': '1',
      'Court Scraper': false,
      'AI Drafting': false,
      'Translation': false,
      'Voice Calls': false,
      'Smart Billing': true,
      'Mobile App': true,
      'Email Support': 'Community',
    },
  },
  {
    name: 'Professional',
    price: '₹3,999',
    period: '/month',
    description: 'For growing firms up to 3 advocates',
    cta: 'Start Free Trial',
    highlight: true,
    features: {
      'Active Cases': '200',
      'Storage': '25 GB',
      'Users': '3',
      'Court Scraper': '8 courts',
      'AI Drafting': false,
      'Translation': false,
      'Voice Calls': false,
      'Smart Billing': true,
      'Mobile App': true,
      'Email Support': '48h response',
    },
  },
  {
    name: 'Elite',
    price: '₹8,999',
    period: '/month',
    description: 'For established firms up to 7 advocates',
    cta: 'Start Free Trial',
    highlight: false,
    features: {
      'Active Cases': '500',
      'Storage': '100 GB',
      'Users': '7',
      'Court Scraper': 'All courts',
      'AI Drafting': true,
      'Translation': true,
      'Voice Calls': false,
      'Smart Billing': true,
      'Mobile App': true,
      'Email Support': '12h priority',
    },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large firms with custom requirements',
    cta: 'Contact Sales',
    highlight: false,
    features: {
      'Active Cases': 'Unlimited',
      'Storage': 'Custom',
      'Users': 'Unlimited',
      'Court Scraper': '+ Custom',
      'AI Drafting': true,
      'Translation': true,
      'Voice Calls': true,
      'Smart Billing': true,
      'Mobile App': true,
      'Email Support': 'Dedicated',
    },
  },
]

const featureLabels = [
  'Active Cases',
  'Storage',
  'Users',
  'Court Scraper',
  'AI Drafting',
  'Translation',
  'Voice Calls',
  'Smart Billing',
  'Mobile App',
  'Email Support',
]

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-4 h-4 text-brand-green mx-auto" />
  if (value === false) return <X className="w-4 h-4 text-gray-600 mx-auto" />
  return <span className="text-gray-300 text-xs">{value}</span>
}

export default function PricingTable() {
  return (
    <section className="relative py-24" id="pricing">
      <div className="absolute inset-0 bg-gradient-to-b from-bg-dark via-bg-dark-3 to-bg-dark" />
      {/* Cyan glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-cyan/5 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-brand-cyan text-sm font-semibold tracking-wider uppercase">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            No hidden fees. No surprise bills. Scale as your firm grows.
          </p>
          <p className="mt-2 text-brand-green text-xs">
            <Zap className="w-3 h-3 inline" /> 14-day free trial on all plans. Cancel anytime.
          </p>
        </div>

        {/* Mobile: scrollable table on small screens */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="min-w-[700px]">
            {/* Plan headers */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div className="glass rounded-xl p-4">
                <p className="text-gray-400 text-xs font-medium mb-1">Feature</p>
              </div>
              {plans.map((plan, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 text-center ${
                    plan.highlight
                      ? 'bg-brand-blue/20 border-2 border-brand-blue shadow-lg shadow-brand-blue/20'
                      : 'glass'
                  }`}
                >
                  {plan.highlight && (
                    <div className="flex justify-center mb-2">
                      <span className="text-[10px] bg-brand-blue text-white px-2 py-0.5 rounded-full font-semibold">
                        POPULAR
                      </span>
                    </div>
                  )}
                  <p className="text-white font-bold text-sm">{plan.name}</p>
                  <div className="mt-1 flex items-baseline justify-center gap-0.5">
                    <span className="text-xl font-bold text-brand-cyan">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-400 text-xs">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-[10px] mt-1 hidden sm:block">
                    {plan.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            <div className="space-y-2">
              {featureLabels.map((label, i) => (
                <div key={i} className="grid grid-cols-5 gap-3">
                  <div className="glass rounded-lg p-3 flex items-center">
                    <span className="text-gray-400 text-xs">{label}</span>
                  </div>
                  {plans.map((plan, j) => (
                    <div
                      key={j}
                      className={`glass rounded-lg p-3 flex items-center justify-center ${
                        plan.highlight ? 'bg-brand-blue/10' : ''
                      }`}
                    >
                      <FeatureValue value={plan.features[label as keyof typeof plan.features] as string | boolean} />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="grid grid-cols-5 gap-3 mt-4">
              <div className="glass rounded-xl p-4" />
              {plans.map((plan, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 text-center ${
                    plan.highlight ? 'bg-brand-blue/20 border-2 border-brand-blue' : 'glass'
                  }`}
                >
                  <Link
                    href={
                      plan.name === 'Enterprise'
                        ? 'mailto:info@letese.xyz'
                        : 'https://app.letese.xyz/register'
                    }
                    className={`block text-xs font-semibold py-2 rounded-lg transition-all ${
                      plan.highlight
                        ? 'bg-brand-blue hover:bg-brand-blue-light text-white'
                        : 'text-brand-cyan hover:text-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
