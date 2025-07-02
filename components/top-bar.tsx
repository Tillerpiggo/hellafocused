'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SyncStatus } from '@/components/sync-status'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function TopBar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
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
          <div className="text-sm text-muted-foreground">hellafocused</div>
          <SyncStatus />
        </div>

        {/* Right side - Authentication Buttons */}
        <div className="flex items-center space-x-3">
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