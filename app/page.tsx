"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { LandingNavigation } from "@/components/landing/landing-navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { VideoDemoSection } from "@/components/landing/video-demo-section"
import { FocusShowcaseSection } from "@/components/landing/focus-showcase-section"
import { AddTasksSection } from "@/components/landing/add-tasks-section"
import { SubdivideTasksSection } from "@/components/landing/subdivide-tasks-section"
import { FinalCTASection } from "@/components/landing/final-cta-section"
import { FAQSection } from "@/components/landing/faq-section"
import { LandingFooter } from "@/components/landing/landing-footer"
import type { User } from "@supabase/supabase-js"

interface LandingContentProps {
  user: User | null
  hasSession: boolean
}

function LandingContent({ user, hasSession }: LandingContentProps) {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation hasSession={hasSession} user={user} />
      <HeroSection hasSession={hasSession} />
      <VideoDemoSection />
      <FocusShowcaseSection />
      <SubdivideTasksSection />
      <AddTasksSection />
      {/* <StickyScrollSection /> */}
      {/* <RecursiveBreakdownSection /> */}
      {/* <FlowSection /> */}
      <FinalCTASection hasSession={hasSession} />
      <FAQSection />
      <LandingFooter />
    </div>
  )
}

function AuthHandler() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // Check if user has a session and isn't anonymous
        if (user && !user.is_anonymous) {
          // Don't redirect if they came from the app (to prevent redirect loops)
          const fromApp = searchParams.get('from') === 'app'
          if (!fromApp) {
            router.push('/app')
            return
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      }
    }

    checkAuthAndRedirect()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user ?? null
        setUser(user)
        
        // Auto-redirect on sign in (unless coming from app)
        if (user && !user.is_anonymous && event === 'SIGNED_IN') {
          const fromApp = searchParams.get('from') === 'app'
          if (!fromApp) {
            router.push('/app')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, searchParams])

  // Don't show loading screen on landing page - just load directly

  const hasSession = Boolean(user && !user.is_anonymous)

  return <LandingContent user={user} hasSession={hasSession} />
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-muted-foreground mt-2">Initializing...</div>
        </div>
      </div>
    }>
      <AuthHandler />
    </Suspense>
  )
}
