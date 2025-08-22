'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { SyncStatus } from '@/components/sync-status'
import { Button } from '@/components/ui/button'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'
import { FeedbackButton } from '@/components/ui/feedback-button'
import { supabase } from '@/lib/supabase'
import { syncEngine } from '@/lib/sync-engine'
import type { User } from '@supabase/supabase-js'

interface TopBarProps {
  onMenuToggle?: () => void
  isMenuOpen?: boolean
}

export function TopBar({ onMenuToggle, isMenuOpen }: TopBarProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint - actual mobile screens
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null
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
        console.log("auth state changed", event, session)
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

  const renderAuthContent = () => {
    if (isAuthLoading) {
      return (
        <div className="flex items-center space-x-3">
          {!isMobile && <FeedbackButton />}
        </div>
      )
    }

    if (user && !isAnonymousUser) {
      return (
        <div className={`flex items-center space-x-3 ${shouldAnimate ? 'animate-profile-fade-in' : 'opacity-0'}`}>
          {!isMobile && <FeedbackButton />}
          {!isMobile && (
            <Link href="https://discord.gg/UQYybzN3Ac" target="_blank" rel="noopener noreferrer" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Discord
            </Link>
          )}
          <ProfileDropdown user={user} showFocusButton={true} />
        </div>
      )
    }

    return (
      <div className={`flex items-center space-x-3 ${shouldAnimate ? 'animate-profile-fade-in' : 'opacity-0'}`}>
        {!isMobile && <FeedbackButton />}
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
    )
  }

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 glass-morphism">
        <div className="flex h-14 items-center justify-between px-6">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="md:hidden"
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}
          {renderAuthContent()}
        </div>
      </div>
    )
  }

  // Desktop layout (unchanged)
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 glass-morphism">
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
          {renderAuthContent()}
        </div>
      </div>
    </div>
  )
} 