import Navbar from './components/Navbar'
import Hero from './components/Hero'
import FeaturesGrid from './components/FeaturesGrid'
import HowItWorks from './components/HowItWorks'
import PricingTable from './components/PricingTable'
import Testimonials from './components/Testimonials'
import CTASection from './components/CTASection'
import Footer from './components/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg-dark">
      <Navbar />
      <Hero />
      <FeaturesGrid />
      <HowItWorks />
      <Testimonials />
      <PricingTable />
      <CTASection />
      <Footer />
    </main>
  )
}
