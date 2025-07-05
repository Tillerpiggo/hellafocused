"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(false)
  const [isFromApp, setIsFromApp] = useState(false)

  useEffect(() => {
    const fromApp = searchParams.get('from') === 'app'
    setIsFromApp(fromApp)

    const checkAuthentication = async () => {
      try {
        // Get the current user session
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error checking authentication:', error)
          setShowLanding(true)
          return
        }

        // If user came from app, always show landing page regardless of auth status
        if (fromApp) {
          setShowLanding(true)
          return
        }

        if (user && !user.is_anonymous) {
          // User has an active non-anonymous session, redirect to app
          console.log('Authenticated user detected, redirecting to app')
          router.push('/app')
          return
        } else {
          // No user or anonymous user, show landing page
          setShowLanding(true)
        }
      } catch (error) {
        console.error('Error during authentication check:', error)
        setShowLanding(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthentication()
  }, [router, searchParams])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-muted-foreground mt-2">Checking authentication</div>
        </div>
      </div>
    )
  }

  // Only show landing page if not authenticated or if we explicitly want to show it
  if (!showLanding) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation isFromApp={isFromApp} />
      <HeroSection isFromApp={isFromApp} />
      <VideoDemoSection />
      <StickyScrollSection />
      <RecursiveBreakdownSection />
      <FlowSection />
      <FocusShowcaseSection />
      <FinalCTASection isFromApp={isFromApp} />
      <FAQSection />
      <LandingFooter />
    </div>
  )
}
