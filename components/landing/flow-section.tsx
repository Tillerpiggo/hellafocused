"use client"

import { useEffect, useState } from "react"
import { X, Plus, Target, ChevronRight, Check, Shuffle } from "lucide-react"

const flowTasks = [
  "Open Google Docs",
  "Write first sentence",
  "Add one paragraph",
  "Save document",
  "Take a break",
  "Review what you wrote",
  "Write next sentence",
  "Add another paragraph",
]

export function FlowSection() {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [showTaskView, setShowTaskView] = useState(true)

  useEffect(() => {
    const cycleSequence = () => {
      // Start with task view
      setShowTaskView(true)

      // After 2 seconds, transition to focus mode
      setTimeout(() => {
        setShowTaskView(false)

        // Show focus mode for a while, then cycle to next task
        setTimeout(() => {
          setCurrentTaskIndex((prev) => (prev + 1) % flowTasks.length)
          cycleSequence() // Restart the sequence
        }, 3000)
      }, 2000)
    }

    // Start the cycling sequence after initial display
    setTimeout(() => {
      cycleSequence()
    }, 2000)
  }, [])

  return (
    <section className="min-h-screen flex flex-col bg-muted/20">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16 py-20">
        {/* Title - Right aligned on desktop */}
        <div className="mb-16">
          <div className="text-center lg:text-right lg:ml-auto lg:max-w-2xl">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Lock in.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mt-6">
              It&apos;s easy to get in the zone when you only have to focus on the task at hand.
            </p>
          </div>
        </div>

        {/* Full screen visual area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-6xl bg-background rounded-3xl border border-border/50 overflow-hidden shadow-2xl relative h-[500px] sm:h-[600px] lg:h-[700px]">
            {/* Task view - shown initially and between cycles */}
            {showTaskView && (
              <div className="w-full h-full p-6 animate-slide-up-in">
                {/* Header with focus button */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light">Get things done</h2>
                  <button className="px-4 py-2 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center gap-2 text-sm animate-pulse">
                    <Target className="h-4 w-4" />
                    Focus
                  </button>
                </div>

                {/* Task list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-2 border-muted-foreground rounded-sm"></div>
                      <span className="text-sm">Write blog post</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-2 border-muted-foreground rounded-sm"></div>
                      <span className="text-sm">Review documents</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-2 border-muted-foreground rounded-sm"></div>
                      <span className="text-sm">Plan meeting</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}

            {/* Focus mode view - matching actual app design */}
            {!showTaskView && (
              <div className="w-full h-full flex flex-col relative animate-gentle-spring-up">
                {/* Exit button in top left (like actual app) */}
                <div className="absolute top-6 left-6 h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center opacity-50">
                  <X className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Add tasks button in top right (like actual app) */}
                <div className="absolute top-6 right-6 h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center opacity-50">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Main content area - centered like actual focus view */}
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-4xl">
                    <h1
                      key={currentTaskIndex}
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-foreground leading-relaxed break-words animate-slide-up-in"
                    >
                      {flowTasks[currentTaskIndex]}
                    </h1>
                  </div>
                </div>

                {/* Bottom action buttons - positioned like actual app */}
                <div className="absolute bottom-0 left-0 right-0 flex flex-col sm:flex-row gap-6 p-8 max-w-md mx-auto w-full">
                  <button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-full transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2">
                    <Check className="h-5 w-5" />
                    Complete
                  </button>
                  <button className="flex-1 py-4 rounded-full transition-all duration-300 hover:scale-105 border-2 border-border flex items-center justify-center gap-2">
                    <Shuffle className="h-5 w-5" />
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
