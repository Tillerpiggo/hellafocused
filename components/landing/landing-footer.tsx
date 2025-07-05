import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="bg-muted/20 border-t border-border/40">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="text-xl font-medium text-primary tracking-wide">
              hellafocused
            </Link>
            <p className="text-sm text-muted-foreground">Turn overwhelming tasks into simple actions.</p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Product</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Roadmap
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Support</h3>
            <div className="space-y-2">
              <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Help Center
              </Link>
              <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Discord
              </Link>
              <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Legal</h3>
            <div className="space-y-2">
              <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">© 2025 Hellafocused. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
