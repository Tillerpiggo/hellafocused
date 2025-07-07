import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"
import { FeedbackButton } from "@/components/ui/feedback-button"
import type { User } from "@supabase/supabase-js"

interface LandingNavigationProps {
  hasSession?: boolean | null
  user?: User | null
}

export function LandingNavigation({ hasSession, user }: LandingNavigationProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6 sm:px-8">
        {/* Left side - Logo */}
        <Link href="/" className="text-lg font-medium text-primary tracking-wide">
          hellafocused
        </Link>

        {/* Right side - Navigation links */}
        <div className="flex items-center gap-6">
          {hasSession && user ? (
            // Authenticated user - show Feedback, Discord and profile with smooth animation
            <div className="flex items-center gap-6 animate-profile-fade-in">
              <FeedbackButton />
              <Link href="https://discord.gg/UQYybzN3Ac" target="_blank" rel="noopener noreferrer" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Discord
              </Link>
              <ProfileDropdown user={user} showBackToApp={true} />
            </div>
          ) : (
            // Not authenticated - show Feedback, Discord and Try Now buttons immediately
            <>
              <FeedbackButton />
              <Link href="https://discord.gg/UQYybzN3Ac" target="_blank" rel="noopener noreferrer" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Discord
              </Link>
              <Link href="/app">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg bg-transparent border border-border hover:bg-muted/20 transition-colors"
                >
                  Try now
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
