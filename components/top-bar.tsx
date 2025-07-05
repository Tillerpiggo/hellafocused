'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SyncStatus } from '@/components/sync-status'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { syncEngine } from '@/lib/sync-engine'
import type { User } from '@supabase/supabase-js'

export function TopBar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      // Dispatch sync engine update outside of callback
      setTimeout(() => {
        syncEngine.setCurrentUser(user?.id || null)
      }, 0)
    }

    getInitialSession()

    // Listen for auth changes - this provides session data, so we keep using session here
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user ?? null
        setUser(user)
        
        // Dispatch sync engine update outside of callback to avoid deadlocks
        setTimeout(() => {
          syncEngine.setCurrentUser(user?.id || null)
        }, 0)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      // Clear local state before signing out
      syncEngine.clearAllLocalState()
      
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const isAnonymousUser = user && user.is_anonymous

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left side - Logo and Sync Status */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/?from=app')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            hellafocused
          </button>
          <SyncStatus />
        </div>

        {/* Right side - Theme Toggle and Authentication Buttons */}
        <div className="flex items-center space-x-3">
          {/* <ThemeToggle /> */}
          {user && !isAnonymousUser ? (
            // Authenticated user
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                {user.email || 'Signed in'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                Sign out
              </Button>
            </div>
          ) : (
            // Not authenticated or anonymous user
            <>
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
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 