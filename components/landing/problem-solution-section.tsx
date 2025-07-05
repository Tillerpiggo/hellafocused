import { AlertCircle, Target } from "lucide-react"

export function ProblemSolutionSection() {
  return (
    <section className="py-20 bg-muted/20">
      <div className="container max-w-screen-xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-4">
            Your to-do app is failing you. Here's why:
          </h2>
        </div>

        <div className="space-y-20">
          {/* Problem 1 */}
          <div className="spawce-y-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h3 className="text-2xl font-medium text-foreground">Problem 1: Your tasks are too big to start</h3>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Something like "write a book" isn't a task you can just "do"!
            </p>

            {/* Visual representation of big tasks */}
            <div className="bg-background rounded-2xl p-6 border border-border/50">
              <div className="bg-destructive/10 text-destructive px-8 py-6 rounded-lg text-center font-medium text-xl">
                write book
              </div>
            </div>
          </div>

          {/* Problem 2 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-destructive" />
              <h3 className="text-2xl font-medium text-foreground">Problem 2: You have too many choices</h3>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              As soon as a to-do list has more than one item, paralysis strikes. Which should you do first? I'd rather
              watch YouTube.
            </p>

            {/* Visual representation of too many choices */}
            <div className="bg-background rounded-2xl p-6 border border-border/50">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="bg-destructive/10 text-destructive px-3 py-2 rounded text-center">
                    You have too many choices
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
