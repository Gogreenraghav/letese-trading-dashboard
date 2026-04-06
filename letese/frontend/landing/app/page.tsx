import Navbar from './components/Navbar'
import Hero from './components/Hero'
import FeaturesGrid from './components/FeaturesGrid'
import PricingTable from './components/PricingTable'
import Testimonials from './components/Testimonials'
import CTASection from './components/CTASection'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <FeaturesGrid />
      <PricingTable />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  )
}
