"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface HeroSectionProps {
  isFromApp?: boolean
}

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

export function HeroSection({ isFromApp = false }: HeroSectionProps) {
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
                  "{examples[currentExample].goal}"
                </span>
              </span>{" "}
              into{" "}
              <span className="relative inline-block">
                <span
                  key={`task-${currentExample}`}
                  className="text-primary font-medium animate-in fade-in duration-500"
                >
                  "{examples[currentExample].task}"
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
                <Button 
                  size="lg" 
                  className={`text-lg px-8 py-6 ${isFromApp ? 'bg-primary hover:bg-primary/90' : ''}`}
                >
                  {isFromApp ? "Back to app" : "Go to app"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Demo Video */}
          <div className="mt-16">
            <div className="bg-background rounded-3xl border border-border/50 overflow-hidden shadow-2xl max-w-4xl mx-auto relative group cursor-pointer">
              <video 
                className="w-full h-auto rounded-3xl"
                autoPlay 
                loop 
                muted 
                playsInline
                poster="/heroDemo_dark.mp4"
              >
                <source src="/heroDemo_dark.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-3xl">
                <Link href="/app">
                  <Button 
                    size="lg" 
                    className={`text-lg px-8 py-6 ${isFromApp ? 'bg-primary hover:bg-primary/90' : 'bg-primary hover:bg-primary/90'} transform hover:scale-105 transition-all duration-200 shadow-lg`}
                  >
                    {isFromApp ? "Back to app" : "Go to app"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
