"use client"

import { useEffect, useState } from "react"
import { X, Plus, Shuffle, Check } from "lucide-react"

const focusTasks = [
  "Drink water",
  "Open Google Docs",
  "Write first sentence",
  "Take a deep breath",
  "Check email",
  "Call mom",
  "Stretch for 30 seconds",
  "Read one paragraph",
  "Make coffee",
  "Send that text",
]

export function FocusShowcaseSection() {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTaskIndex((prev) => (prev + 1) % focusTasks.length)
    }, 3000) // Change task every 3 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="min-h-screen flex flex-col bg-primary/5">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16 py-20">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-foreground">
            The best to-do app for getting locked in.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto mt-6">
            Focus Mode continually presents you with a random choice from the smallest subtasks (the leaf nodes), making
            it easy to get in a flow state.
          </p>
        </div>

        {/* Full screen visual area - using fixed heights instead of aspect ratio */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-6xl bg-background rounded-3xl border border-border/50 overflow-hidden shadow-2xl relative h-[500px] sm:h-[600px] lg:h-[700px]">
            {/* Mock focus mode interface matching the actual app */}
            <div className="w-full h-full flex flex-col relative">
              {/* Exit button in top left (like actual app) */}
              <div className="absolute top-6 left-6 h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center opacity-50">
                <X className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Add tasks button in top right (like actual app) */}
              <div className="absolute top-6 right-6 h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center opacity-50">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* Main content area - centered like actual focus view */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-4xl">
                  <h1
                    key={currentTaskIndex}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-foreground leading-relaxed break-words animate-slide-up-in"
                  >
                    {focusTasks[currentTaskIndex]}
                  </h1>
                </div>
              </div>

              {/* Bottom action buttons - positioned at absolute bottom */}
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
          </div>
        </div>
      </div>
    </section>
  )
}
