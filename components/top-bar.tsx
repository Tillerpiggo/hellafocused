'use client'

import { SyncStatus } from '@/components/sync-status'
import { Button } from '@/components/ui/button'

export function TopBar() {
  const handleSignIn = () => {
    // TODO: Implement sign in functionality
    console.log('Sign in clicked')
  }

  const handleSignUp = () => {
    // TODO: Implement sign up functionality  
    console.log('Sign up clicked')
  }

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left side - Logo and Sync Status */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">hellafocused v1.0</div>
          <SyncStatus />
        </div>

        {/* Right side - Authentication Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignIn}
            className="text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Button>
          <Button
            size="sm"
            onClick={handleSignUp}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Sign up
          </Button>
        </div>
      </div>
    </div>
  )
} 