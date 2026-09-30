import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { HeroSection } from '@/sections/Hero/HeroSection'
import { BrandStatement } from '@/sections/Brand/BrandStatement'
import { AboutSection } from '@/sections/About/AboutSection'
import { ValuesSection } from '@/sections/Values/ValuesSection'
import { OfferSection } from '@/sections/Offer/OfferSection'
import { ProcessSection } from '@/sections/Process/ProcessSection'
import { AreaSection } from '@/sections/Area/AreaSection'
import { CTASection } from '@/sections/CTA/CTASection'
import { ContactSection } from '@/sections/Contact/ContactSection'
import { scrollToSection } from '@/utils/scrollToSection'
import config from '@/data/site.config.json'

export default function HomePage() {
  const { hash } = useLocation()

  // Wejście z podstrony na "/#kontakt" — przewiń po zamontowaniu sekcji.
  useEffect(() => {
    if (!hash) return
    const timer = window.setTimeout(() => scrollToSection(hash), 60)
    return () => window.clearTimeout(timer)
  }, [hash])

  return (
    <>
      <Seo
        title={config.seo.title}
        description={config.seo.description}
        canonical={config.seo.canonical}
      />
      <HeroSection />
      <BrandStatement />
      <AboutSection />
      <ValuesSection />
      <OfferSection />
      <ProcessSection />
      <AreaSection />
      <CTASection />
      <ContactSection />
    </>
  )
}
