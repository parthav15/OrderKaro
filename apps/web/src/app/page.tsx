"use client"

import { MotionConfig } from "framer-motion"
import { SiteHeader } from "@/components/landing/site-header"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { StatsSection } from "@/components/landing/stats-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { FinalCtaSection } from "@/components/landing/final-cta-section"
import { SiteFooter } from "@/components/landing/site-footer"

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-full overflow-x-clip bg-canvas">
        <SiteHeader />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <StatsSection />
          <PricingSection />
          <FinalCtaSection />
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  )
}
