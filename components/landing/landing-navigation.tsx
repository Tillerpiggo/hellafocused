import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"
import type { User } from "@supabase/supabase-js"

interface LandingNavigationProps {
  hasSession?: boolean | null
  user?: User | null
  loading?: boolean
}

export function LandingNavigation({ hasSession, user, loading }: LandingNavigationProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6 sm:px-8">
        {/* Left side - Logo */}
        <Link href="/" className="text-lg font-medium text-primary tracking-wide">
          hellafocused
        </Link>

        {/* Right side - Navigation links */}
        <div className="flex items-center gap-6">
          {!loading && (
            <Link href="https://discord.gg/UQYybzN3Ac" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors animate-profile-fade-in">
              Discord
            </Link>
          )}
          
          {!loading && (
            hasSession && user ? (
              <ProfileDropdown user={user} showBackToApp={true} />
            ) : (
              <Link href="/app">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg bg-transparent border border-border hover:bg-muted/20 transition-colors animate-profile-fade-in"
                >
                  Try now
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  )
}
