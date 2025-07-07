"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getBaseUrl } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current user to see if authentication was successful
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Auth callback error:', error)
          window.location.href = getBaseUrl()
          return
        }

        if (user) {
          // Check if this is a new authenticated user upgrading from anonymous
          await handleAnonymousUpgrade(user.id)
          
          // Check for pending task input and handle project creation
          await handlePendingTaskInput()
          
          // Successfully authenticated, redirect to app
          window.location.href = `${getBaseUrl()}/app`
        } else {
          // No user, redirect to landing
          window.location.href = getBaseUrl()
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error)
        window.location.href = getBaseUrl()
      }
    }

    const handlePendingTaskInput = async () => {
      try {
        const pendingTaskInput = sessionStorage.getItem('pending-task-input')
        if (pendingTaskInput) {
          // Clear the pending input
          sessionStorage.removeItem('pending-task-input')
          
          // Store the project creation request for the app to handle
          sessionStorage.setItem('create-project-and-navigate', JSON.stringify({
            projectName: pendingTaskInput,
            timestamp: Date.now()
          }))
        }
      } catch (error) {
        console.error('Error handling pending task input:', error)
      }
    }

    const handleAnonymousUpgrade = async (newUserId: string) => {
      try {
        // Only attempt migration for sign-up flows, not login flows
        const authFlowType = sessionStorage.getItem('auth-flow-type')
        
        if (authFlowType !== 'signup') {
          // This is a login flow, clear any flags and skip migration
          sessionStorage.removeItem('auth-flow-type')
          sessionStorage.removeItem('previous-anonymous-user-id')
          return
        }
        
        // Check if there was a previous anonymous session stored (only happens during account creation)
        const previousAnonymousUserId = sessionStorage.getItem('previous-anonymous-user-id')
        
        if (previousAnonymousUserId && previousAnonymousUserId !== newUserId) {
          // Call the database function to migrate data
          const { error } = await supabase.rpc('migrate_anonymous_data_to_user', {
            authenticated_user_id: newUserId,
            anonymous_user_id: previousAnonymousUserId
          })
          
          if (error) {
            console.error('Failed to migrate anonymous data:', error)
          } else {
            console.log('✅ Successfully migrated anonymous data to new account')
          }
        }
        
        // Clean up all session flags after processing
        sessionStorage.removeItem('auth-flow-type')
        sessionStorage.removeItem('previous-anonymous-user-id')
      } catch (error) {
        console.error('Error during anonymous data migration:', error)
        // Clean up flags even on error
        sessionStorage.removeItem('auth-flow-type')
        sessionStorage.removeItem('previous-anonymous-user-id')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-lg font-medium">Completing authentication...</div>
        <div className="text-muted-foreground mt-2">Please wait while we sign you in.</div>
      </div>
    </div>
  )
} 