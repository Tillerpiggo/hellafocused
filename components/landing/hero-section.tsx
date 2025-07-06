"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { X, Plus, Check, Shuffle } from "lucide-react"

const examples = [
  { goal: "write a book", task: "open a blank document" },
  { goal: "learn Spanish", task: "say 'hola'" },
  { goal: "get fit", task: "put on workout clothes" },
  { goal: "start a business", task: "write down one idea" },
  { goal: "learn piano", task: "find middle C" },
  { goal: "organize home", task: "throw away one thing" },
  { goal: "eat healthier", task: "drink one glass of water" },
  { goal: "save money", task: "check bank balance" },
  { goal: "make friends", task: "smile at one person" },
  { goal: "learn coding", task: "visit codecademy.com" },
  { goal: "read more", task: "read one page" },
  { goal: "meditate daily", task: "breathe deeply 3 times" },
  { goal: "garden", task: "water one plant" },
  { goal: "cook more", task: "boil water" },
  { goal: "network", task: "update LinkedIn headline" },
]

interface HeroSectionProps {
  hasSession?: boolean | null
}

export function HeroSection({ hasSession }: HeroSectionProps) {
  const [currentExample, setCurrentExample] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % examples.length)
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 pt-4 lg:pt-0">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="text-center">
          {/* Hero Title - Bottom aligned to midpoint */}
          <div className="flex flex-col justify-end h-64 mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-foreground leading-tight">
              Hellafocused turns{" "}
              <span className="relative inline-block">
                <span
                  key={`goal-${currentExample}`}
                  className="text-primary font-medium animate-in fade-in duration-500"
                >
                  &quot;{examples[currentExample].goal}&quot;
                </span>
              </span>{" "}
              into{" "}
              <span className="relative inline-block">
                <span
                  key={`task-${currentExample}`}
                  className="text-primary font-medium animate-in fade-in duration-500"
                >
                  &quot;{examples[currentExample].task}&quot;
                </span>
              </span>
            </h1>
          </div>

          {/* Subtitle and CTA - Top aligned to midpoint */}
          <div className="flex flex-col justify-start">
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Focusing becomes easy when your to-do app tells you what to do.
            </p>
            <div className="flex justify-center">
              <Link href="/app">
                <Button size="lg" className="text-lg px-8 py-6">
                  {hasSession ? "Back to app" : "Start focusing now"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Focus Mode Visual - Matching actual focus view with taller container */}
          <div className="mt-16 -mx-4 sm:-mx-6 lg:-mx-8">
            <div
              className="bg-background rounded-3xl border border-border/50 overflow-hidden shadow-2xl w-full mx-auto relative"
              style={{ height: "500px" }}
            >
              {/* Focus view layout matching actual app */}
              <div className="w-full h-full flex flex-col relative">
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
                      key={`visual-task-${currentExample}`}
                      className="text-3xl sm:text-4xl md:text-5xl font-light text-foreground leading-relaxed break-words animate-in fade-in duration-500"
                    >
                      {examples[currentExample].task}
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
      </div>
    </section>
  )
}
