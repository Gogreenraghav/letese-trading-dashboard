import Navbar from '../components/Navbar'
import PricingTable from '../components/PricingTable'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'

export const metadata = {
  title: 'Pricing — LETESE● Legal Practice Management',
  description: 'Simple, transparent pricing for law firms of all sizes. Start free, scale as you grow.',
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-bg-dark">
      <Navbar />
      {/* Page header */}
      <div className="pt-32 pb-8 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Pricing Plans
        </h1>
        <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
          Start free, upgrade when you&apos;re ready. No hidden fees, no surprise bills.
        </p>
        <p className="mt-2 text-brand-green text-sm">
          14-day free trial on all plans — no credit card required
        </p>
      </div>
      <PricingTable />
      <CTASection />
      <Footer />
    </main>
  )
}
