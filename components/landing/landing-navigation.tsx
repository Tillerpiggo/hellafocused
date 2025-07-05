import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingNavigation() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6 sm:px-8">
        {/* Left side - Logo */}
        <Link href="/" className="text-lg font-medium text-primary tracking-wide">
          hellafocused v1.0
        </Link>

        {/* Right side - Navigation links */}
        <div className="flex items-center gap-6">
          <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Discord
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg bg-transparent border border-border hover:bg-muted/20 transition-colors"
          >
            Try now
          </Button>
        </div>
      </div>
    </nav>
  )
}
