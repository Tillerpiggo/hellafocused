import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface FinalCTASectionProps {
  hasSession?: boolean | null
}

export function FinalCTASection({ hasSession }: FinalCTASectionProps) {
  return (
    <section className="py-32 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container max-w-4xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="relative">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 blur-3xl opacity-50" />
          
          {/* Content */}
          <div className="relative text-center space-y-8">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
              Treat yourself.
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join <span className="line-through decoration-2">thousands</span> a few people who&apos;ve discovered a calmer way to work.
            </p>
            
            <div className="flex flex-col items-center space-y-4">
              <Link href="/app">
                <Button 
                  size="lg" 
                  className="group px-12 py-6 text-lg rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {hasSession ? "Back to app" : "Start now for free"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              {!hasSession && (
                <p className="text-sm text-muted-foreground">
                  No signup required. Start in seconds.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}