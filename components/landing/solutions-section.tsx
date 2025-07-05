import { Split, Focus } from "lucide-react"

export function SolutionsSection() {
  return (
    <section className="py-20">
      <div className="container max-w-screen-xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-4">
            How hellafocused solves both problems
          </h2>
        </div>

        <div className="space-y-20">
          {/* Solution 1 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Split className="h-8 w-8 text-primary" />
              <h3 className="text-2xl font-medium text-foreground">Break big tasks into tiny steps</h3>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Split tasks down recursively until they're so simple you can't say no—"write book" becomes "Open Google
              Docs."
            </p>

            {/* Broken down task */}
            <div className="bg-background rounded-2xl p-6 border border-border/50">
              <div className="bg-primary/10 text-primary px-6 py-3 rounded-lg text-center text-lg font-medium">
                Open Google Docs
              </div>
            </div>
          </div>

          {/* Solution 2 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Focus className="h-8 w-8 text-primary" />
              <h3 className="text-2xl font-medium text-foreground">Get one task at a time in Focus Mode</h3>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Click "focus", and we'll feed you one task at a time. No more decision paralysis.
            </p>

            {/* Focus mode visual */}
            <div className="bg-primary/5 rounded-2xl p-8 border border-primary/20 text-center">
              <Focus className="h-12 w-12 text-primary mx-auto mb-4" />
              <div className="text-2xl font-light text-foreground mb-2">Open Google Docs</div>
              <div className="text-sm text-muted-foreground">Focus Mode: One task at a time</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
