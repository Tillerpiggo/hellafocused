import { List, Split, Target } from "lucide-react"

export function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-4">How to use hellafocused</h2>
        </div>

        <div className="space-y-24">
          {/* Step 1 */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-medium">
                1
              </div>
              <h3 className="text-2xl font-medium text-foreground">List your tasks</h3>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">List the big things you need to get done.</p>
            <div className="bg-background rounded-2xl p-6 border border-border/50">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <List className="h-5 w-5 text-muted-foreground" />
                  <span className="text-foreground">Prepare for job interview</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <List className="h-5 w-5 text-muted-foreground" />
                  <span className="text-foreground">Plan weekend trip</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <List className="h-5 w-5 text-muted-foreground" />
                  <span className="text-foreground">Learn Spanish</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-medium">
                2
              </div>
              <h3 className="text-2xl font-medium text-foreground">Break them into tiny steps</h3>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Break down your tasks recursively until each task is trivial.
            </p>
            <div>
              <div className="bg-background rounded-2xl p-6 border border-border/50">
                <div className="space-y-4">
                  <div className="text-foreground font-medium mb-3">Prepare for job interview</div>
                  <div className="ml-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Split className="h-4 w-4" />
                      Research the company
                    </div>
                    <div className="ml-6 space-y-1 text-xs">
                      <div className="text-muted-foreground">• Visit company website</div>
                      <div className="text-muted-foreground">• Read recent news</div>
                      <div className="text-muted-foreground">• Check LinkedIn</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Split className="h-4 w-4" />
                      Practice common questions
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Split className="h-4 w-4" />
                      Choose outfit
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-medium">
                3
              </div>
              <h3 className="text-2xl font-medium text-foreground">Do them with Focus Mode</h3>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Click "focus", and hellafocused will feed you tasks to do one at a time.
            </p>
            <div className="bg-primary/5 rounded-2xl p-8 border border-primary/20 text-center">
              <Target className="h-16 w-16 text-primary mx-auto mb-6" />
              <div className="text-3xl font-light text-foreground mb-4">Visit company website</div>
              <div className="flex gap-4 justify-center">
                <button className="bg-primary text-primary-foreground px-6 py-2 rounded-full">Complete</button>
                <button className="border border-border px-6 py-2 rounded-full">Next</button>
              </div>
              <div className="text-sm text-muted-foreground mt-4">Focus Mode: One task, zero distractions</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
