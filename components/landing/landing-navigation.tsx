import Link from "next/link"
import { Button } from "@/components/ui/button"

interface LandingNavigationProps {
  isFromApp?: boolean
}

export function LandingNavigation({ isFromApp = false }: LandingNavigationProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6 sm:px-8">
        {/* Left side - Logo */}
        <Link href="/" className="text-lg font-medium text-primary tracking-wide">
          hellafocused
        </Link>

        {/* Right side - Navigation links */}
        <div className="flex items-center gap-6">
          <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Discord
          </Link>
          <Link href="/app">
            <Button
              variant={isFromApp ? "default" : "outline"}
              size="sm"
              className={isFromApp 
                ? "rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                : "rounded-lg bg-transparent border border-border hover:bg-muted/20 transition-colors"
              }
            >
              {isFromApp ? "Back to app" : "Go to app"}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
