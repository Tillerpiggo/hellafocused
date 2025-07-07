import { Button } from "@/components/ui/button"
import Link from "next/link"

interface FinalCTASectionProps {
  hasSession?: boolean | null
}

export function FinalCTASection({ hasSession }: FinalCTASectionProps) {
  return (
    <section className="py-20">
      <div className="container max-w-4xl mx-auto px-8 sm:px-12 lg:px-16 text-center">
        <h2 className="text-4xl sm:text-5xl font-light text-foreground mb-8">
          Ready to get hella focused?
        </h2>
        <div className="flex flex-col items-center">
          <Link href="/app">
            <Button size="lg" className="px-12 py-4 text-xl rounded-full bg-primary hover:bg-primary/90">
              {hasSession ? "Back to app" : "Get started for free"}
            </Button>
          </Link>
          {!hasSession && (
            <p className="text-sm text-muted-foreground mt-2">
              No signup required
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
