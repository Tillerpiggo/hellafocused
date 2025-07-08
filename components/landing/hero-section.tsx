"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check } from "lucide-react"

const examples = [
  { goal: "Get fit", task: "do 1 push-up" },
  { goal: "Start journaling", task: "open notes app" },
  { goal: "Meditate daily", task: "take a deep breath" },
  { goal: "Clean my room", task: "take out the trash" },
  { goal: "Write a book", task: "open Google Docs" },
  { goal: "Start a business", task: "name a problem" }, 
  { goal: "Make friends", task: "text someone 'how are you?'" },
  { goal: "Cook dinner", task: "turn on the stove" },
  
];

interface HeroSectionProps {
  hasSession?: boolean | null
}

export function HeroSection({ hasSession }: HeroSectionProps) {
  const [currentExample, setCurrentExample] = useState(0)
  const [isTaskChecked, setIsTaskChecked] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for dark mode
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                        window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(isDarkMode)
    }
    
    checkTheme()
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkTheme)
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkTheme)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTaskChecked(true)
      
      // After a brief pause, move to next example and uncheck
      setTimeout(() => {
        const nextExample = (currentExample + 1) % examples.length
        setCurrentExample(nextExample)
        // Always reset to unchecked, and ensure first example stays unchecked
        setIsTaskChecked(false)
      }, 1000)
    }, 4000)

    return () => clearInterval(interval)
  }, [currentExample])

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/20 via-background to-purple-50/10 dark:from-blue-950/10 dark:via-background dark:to-purple-950/5 pt-4 lg:pt-0">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="text-center">
          {/* Hero Title - Bottom aligned to midpoint */}
          <div className="flex flex-col justify-end h-72 sm:h-64 mb-8 pt-8 sm:pt-0">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-4">
              {/* Break down <span className="text-primary font-bold italic">any goal.</span> */}
              {/* One task. Full screen. */}
              {/* Break down any goal. */}
              {/* Make anything easy. */}
              Bite-sized productivity.
            </h1>
            
            {/* Typing effect subtitle with todo styling */}
            <div className="text-xl sm:text-2xl lg:text-3xl font-normal text-muted-foreground leading-tight">
              <div 
                key={`example-${currentExample}`}
                className="flex flex-col sm:inline-flex sm:flex-row items-center gap-3 sm:gap-4 animate-wipe-in"
                style={{
                  animation: 'wipe-in 0.8s ease-out forwards'
                }}
              >
                {/* Goal todo item */}
                <div className="flex items-center gap-3 sm:gap-2 bg-muted/20 rounded-lg px-6 py-3 sm:px-4 sm:py-2 border border-border/30">
                  <div className="h-5 w-5 sm:h-4 sm:w-4 rounded-sm border-2 border-muted-foreground bg-transparent flex items-center justify-center">
                  </div>
                  <span className="text-muted-foreground">
                    {examples[currentExample].goal}
                  </span>
                </div>

                <span className="text-muted-foreground mx-0 sm:mx-2">becomes</span>

                {/* Task todo item */}
                <div className="flex items-center gap-3 sm:gap-2 bg-muted/20 rounded-lg px-6 py-3 sm:px-4 sm:py-2 border border-border/30">
                  <div 
                    className={`h-5 w-5 sm:h-4 sm:w-4 rounded-sm border-2 transition-all duration-300 flex items-center justify-center ${
                      isTaskChecked ? 'border-blue-500 bg-blue-500' : 'border-muted-foreground bg-transparent'
                    }`}
                  >
                    {isTaskChecked && (
                      <Check className="h-4 w-4 sm:h-3 sm:w-3 text-white animate-in zoom-in duration-200" />
                    )}
                  </div>
                  <span 
                    className={`text-muted-foreground transition-all duration-300 ${
                      isTaskChecked ? 'line-through' : ''
                    }`}
                  >
                    {examples[currentExample].task}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA - Top aligned to midpoint */}
          <div className="flex flex-col justify-start">
            <div className="flex flex-col items-center mt-6">
              <Link href="/app">
                <Button size="lg" className="text-lg px-8 py-6">
                  {hasSession ? (
                    <>
                      <span className="sm:hidden">Continue to app</span>
                      <span className="hidden sm:inline">Continue to app</span>
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">Start by tapping here</span>
                      <span className="hidden sm:inline">Get started for free</span>
                    </>
                  )}
                </Button>
              </Link>
              {!hasSession && (
                <p className="text-sm text-muted-foreground mt-2">
                  No signup required.
                </p>
              )}
            </div>
          </div>



          {/* Visual Demo */}
          <div className="-mx-4 sm:-mx-6 lg:-mx-8 relative mt-16">
            <div className="rounded-3xl border border-border/50 overflow-hidden shadow-2xl w-full mx-auto relative">
              <video
                key={isDark ? 'dark' : 'light'}
                src={isDark ? "/HeroDemo_Dark.mov" : "/HeroDemo_Light.mov"}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
