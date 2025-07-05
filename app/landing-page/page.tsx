import { LandingNavigation } from "@/components/landing/landing-navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { VideoDemoSection } from "@/components/landing/video-demo-section"
import { StickyScrollSection } from "@/components/landing/sticky-scroll-section"
import { RecursiveBreakdownSection } from "@/components/landing/recursive-breakdown-section"
import { FlowSection } from "@/components/landing/flow-section"
import { FocusShowcaseSection } from "@/components/landing/focus-showcase-section"
import { FinalCTASection } from "@/components/landing/final-cta-section"
import { FAQSection } from "@/components/landing/faq-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation />
      <HeroSection />
      <VideoDemoSection />
      <StickyScrollSection />
      <RecursiveBreakdownSection />
      <FlowSection />
      <FocusShowcaseSection />
      <FinalCTASection />
      <FAQSection />
      <LandingFooter />
    </div>
  )
}
