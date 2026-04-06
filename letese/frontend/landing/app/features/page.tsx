import Navbar from '../components/Navbar'
import FeaturesGrid from '../components/FeaturesGrid'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'

export const metadata = {
  title: 'Features — LETESE● Legal Practice Management',
  description: '12 powerful features built for Indian law firms. Court scraping, AI drafting, WhatsApp reminders, and more.',
}

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-bg-dark">
      <Navbar />
      {/* Page header */}
      <div className="pt-32 pb-8 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Powerful Features
        </h1>
        <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
          Every tool your law firm needs — from real-time court scraping to AI-powered document drafting — in one unified platform.
        </p>
      </div>
      <FeaturesGrid />
      <CTASection />
      <Footer />
    </main>
  )
}
