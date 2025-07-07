'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SyncStatus } from '@/components/sync-status'
import { Button } from '@/components/ui/button'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'
import { FeedbackButton } from '@/components/ui/feedback-button'
import { supabase } from '@/lib/supabase'
import { syncEngine } from '@/lib/sync-engine'
import type { User } from '@supabase/supabase-js'

export function TopBar() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        // Dispatch sync engine update outside of callback
        setTimeout(() => {
          syncEngine.setCurrentUser(user?.id || null)
        }, 0)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setIsAuthLoading(false)
        // Trigger animation after loading completes
        setTimeout(() => setShouldAnimate(true), 50)
      }
    }

    getInitialSession()

    // Listen for auth changes - this provides session data, so we keep using session here
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user ?? null
        setUser(user)
        setIsAuthLoading(false)
        
        // Trigger animation for auth changes
        setTimeout(() => setShouldAnimate(true), 50)
        
        // Dispatch sync engine update outside of callback to avoid deadlocks
        setTimeout(() => {
          syncEngine.setCurrentUser(user?.id || null)
        }, 0)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const isAnonymousUser = user && user.is_anonymous

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left side - Logo and Sync Status */}
        <div className="flex items-center space-x-4">
          <Link href="/?from=app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            hellafocused
          </Link>
          <SyncStatus />
        </div>

        {/* Right side - Authentication */}
        <div className="flex items-center space-x-3">
          {/* <ThemeToggle /> */}
          {isAuthLoading ? (
            // Show feedback and discord while auth is loading, positioned to slide left when auth loads
            <div className="flex items-center space-x-3">
              <FeedbackButton />
            </div>
          ) : user && !isAnonymousUser ? (
            // Authenticated user - show Feedback, Discord and profile dropdown with animation
            <div className={`flex items-center space-x-3 ${shouldAnimate ? 'animate-profile-fade-in' : 'opacity-0'}`}>
              <FeedbackButton />
              <Link href="https://discord.gg/UQYybzN3Ac" target="_blank" rel="noopener noreferrer" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Discord
              </Link>
              <ProfileDropdown user={user} showFocusButton={true} />
            </div>
          ) : (
            // Not authenticated or anonymous user - show feedback, discord and auth buttons with animation
            <div className={`flex items-center space-x-3 ${shouldAnimate ? 'animate-profile-fade-in' : 'opacity-0'}`}>
              <FeedbackButton />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/auth/log-in')}
                className="text-muted-foreground hover:text-foreground"
              >
                Log in
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/auth/sign-up')}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 