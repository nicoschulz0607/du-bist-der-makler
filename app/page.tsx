import Navbar from '@/components/Navbar'
import Hero from '@/components/sections/Hero'
import HowItWorks from '@/components/sections/HowItWorks'
import Features from '@/components/sections/Features'
import Pricing from '@/components/sections/Pricing'
import FAQ from '@/components/sections/FAQ'
import ClosingCTA from '@/components/sections/ClosingCTA'
import Footer from '@/components/sections/Footer'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <FAQ />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  )
}
