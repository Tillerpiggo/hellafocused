"use client"

import { useEffect, useState } from "react"
import { Check, Star, Target, Sparkles } from "lucide-react"

const achievements = [
  { goal: "Write a novel", progress: "Started with one sentence", icon: "📚" },
  { goal: "Learn piano", progress: "Played first scale", icon: "🎹" },
  { goal: "Get in shape", progress: "Did one push-up", icon: "💪" },
  { goal: "Start a business", progress: "Wrote one idea", icon: "🚀" },
  { goal: "Learn Spanish", progress: "Said 'Hola'", icon: "🇪🇸" },
  { goal: "Cook more", progress: "Boiled water", icon: "👨‍🍳" }
]

export function AmazingSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [checkedItems, setCheckedItems] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      // Add current item to checked list
      setCheckedItems(prev => [...prev, currentIndex])
      
      // After a brief pause, move to next achievement
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % achievements.length)
        // Reset checked items when we cycle back to beginning
        if (currentIndex === achievements.length - 1) {
          setTimeout(() => setCheckedItems([]), 1000)
        }
      }, 2000)
    }, 3500)

    return () => clearInterval(interval)
  }, [currentIndex])

  return (
    <section className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-purple/5">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16 py-20">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground mb-6">
            Do something amazing,{" "}
            <span className="text-primary">one bite-sized task at a time.</span>
          </h2>
        </div>

        {/* Visual Demo */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-4xl bg-background rounded-3xl border border-border/50 overflow-hidden shadow-2xl p-8 lg:p-12">
            
            {/* Achievement grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => {
                const isActive = index === currentIndex
                const isChecked = checkedItems.includes(index)
                
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border transition-all duration-500 ${
                      isActive 
                        ? 'border-primary/50 bg-primary/5 scale-105 shadow-lg' 
                        : isChecked 
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-border/30 bg-muted/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div 
                        className={`h-6 w-6 rounded-sm border-2 transition-all duration-300 flex items-center justify-center mt-1 ${
                          isChecked 
                            ? 'border-green-500 bg-green-500' 
                            : isActive 
                            ? 'border-primary bg-transparent' 
                            : 'border-muted-foreground bg-transparent'
                        }`}
                      >
                        {isChecked && (
                          <Check className="h-4 w-4 text-white animate-in zoom-in duration-200" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{achievement.icon}</span>
                          {isActive && (
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                          )}
                        </div>
                        <h3 
                          className={`font-medium mb-1 transition-colors duration-300 ${
                            isChecked 
                              ? 'text-green-600 line-through' 
                              : isActive 
                              ? 'text-primary' 
                              : 'text-foreground'
                          }`}
                        >
                          {achievement.goal}
                        </h3>
                        <p 
                          className={`text-sm transition-colors duration-300 ${
                            isActive ? 'text-primary/80' : 'text-muted-foreground'
                          }`}
                        >
                          {achievement.progress}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom message */}
            <div className="text-center mt-12 pt-8 border-t border-border/20">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                <Target className="h-5 w-5" />
                <span className="text-lg font-medium">
                  {checkedItems.length} / {achievements.length} amazing things started
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Each checked item represents someone who took the first tiny step
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 