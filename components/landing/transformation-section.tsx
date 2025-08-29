"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"

const examples = [
  { goal: "Get fit", task: "do 1 push-up" },
  { goal: "Start a blog", task: "open notes app" },
  { goal: "Meditate daily", task: "take a deep breath" },
  { goal: "Clean my room", task: "take out the trash" },
  { goal: "Write a book", task: "open Google Docs" },
  { goal: "Fix a bug", task: "add a print statement" }, 
  { goal: "Make friends", task: "text someone 'how are you?'" },
  { goal: "Cook dinner", task: "turn on the stove" },
]

export function TransformationSection() {
  const [currentExample, setCurrentExample] = useState(0)
  const [isTaskChecked, setIsTaskChecked] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTaskChecked(true)
      
      // After a brief pause, move to next example and uncheck
      setTimeout(() => {
        const nextExample = (currentExample + 1) % examples.length
        setCurrentExample(nextExample)
        setIsTaskChecked(false)
      }, 1000)
    }, 4000)

    return () => clearInterval(interval)
  }, [currentExample])

  return (
    <section className="py-32 relative bg-gradient-to-b from-background via-blue-50/3 to-background dark:from-background dark:via-blue-950/3 dark:to-background">
      <div className="container max-w-7xl mx-auto px-8">
        {/* Top separator - thinner and more subtle */}
        <div className="flex justify-center mb-24">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-border/20 to-transparent"></div>
        </div>
        
        <div className="relative">
          <div className="text-lg sm:text-xl lg:text-2xl font-light text-center">
            <div 
              key={`example-${currentExample}`}
              className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12"
              style={{
                animation: 'fadeIn 0.8s ease-out forwards'
              }}
            >
              {/* Goal card - bigger with more breathing room */}
              <div className="glass-morphism rounded-3xl px-12 py-8 min-w-[280px] text-center border border-border/10 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-4">
                  <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 bg-transparent"></div>
                  <span className="text-foreground/60 font-light text-xl">
                    {examples[currentExample].goal}
                  </span>
                </div>
              </div>

              {/* "becomes" text - more subtle */}
              <span className="text-muted-foreground/40 text-sm font-light tracking-wide">becomes</span>

              {/* Task card - bigger and more prominent */}
              <div className="glass-morphism rounded-3xl px-12 py-8 min-w-[280px] text-center border border-primary/10 bg-primary/3 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-4">
                  <div 
                    className={`h-6 w-6 rounded-full border-2 transition-all duration-700 flex items-center justify-center ${
                      isTaskChecked ? 'border-primary bg-primary' : 'border-primary/50 bg-transparent'
                    }`}
                  >
                    {isTaskChecked && (
                      <Check className="h-4 w-4 text-white animate-in zoom-in duration-300" />
                    )}
                  </div>
                  <span 
                    className={`font-light text-xl transition-all duration-700 ${
                      isTaskChecked ? 'line-through text-muted-foreground/60' : 'text-primary/80'
                    }`}
                  >
                    {examples[currentExample].task}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom separator - thinner and more subtle */}
        <div className="flex justify-center mt-24">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-border/20 to-transparent"></div>
        </div>
      </div>
    </section>
  )
}