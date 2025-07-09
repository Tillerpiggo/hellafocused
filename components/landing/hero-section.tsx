"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check } from "lucide-react"

const examples = [
  { goal: "Get fit", task: "do 1 push-up" },
  { goal: "Start a blog", task: "open notes app" },
  { goal: "Meditate daily", task: "take a deep breath" },
  { goal: "Clean my room", task: "pick up one piece of trash" },
  { goal: "Write a book", task: "open Google Docs" },
  { goal: "Fix a bug", task: "add a print statement" },
  { goal: "Make friends", task: "text someone 'how are you?'" },
  { goal: "Cook dinner", task: "take one step towards the kitchen" },
  
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
    <section className="min-h-screen bg-gradient-to-br from-blue-50/20 via-background to-purple-50/10 dark:from-blue-950/10 dark:via-background dark:to-purple-950/5">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="text-center pt-24 sm:pt-32 lg:pt-40">
          {/* Hero Title */}
          <div className="mb-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-4">
              {/* Start small but actually get stuff done. */}
              Organize your projects into trees of tasks.
              {/* A project manager for procrastinators. */}
              {/* Project management for procrastinators. */}
              {/* One task. Full screen. */}
              {/* Break down any goal. */}
              {/* Make anything easy. */}
              {/* Focus on one tiny task at a time. */}
              {/* Big tasks are hard. Make them smaller. */}
              {/* Bite-sized productivity. */}
              {/* Turn your projects into tiny tasks. */}
              {/* Productivity unleashed. */}
              {/* Break down anything, one task at a time. */}
              {/* Make your tasks tiny and actually get started. */}
              {/* Turn your to-do list into a to-do queue. */}
              {/* Focus in a flow state. */}
              {/* Stop planning. Start doing. */}
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground mb-8">
               Hellafocused is a to-do app that lets you break down tasks infinitely and then feeds you them one by one.
            </p>
            
            
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center mt-12">
            <Link href="/app">
              <Button size="lg" className="text-lg px-8 py-6">
                {hasSession ? (
                  <>
                    <span className="sm:hidden">Continue to app</span>
                    <span className="hidden sm:inline">Continue to app</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Get started for free</span>
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



          {/* Visual Demo */}
          <div className="-mx-4 sm:-mx-6 lg:-mx-8 relative mt-16">
            <div className="rounded-3xl border border-border/50 overflow-hidden shadow-2xl w-full mx-auto relative">
              <video
                key={isDark ? 'dark' : 'light'}
                src={isDark ? "/Breakdown_Dark.mov" : "/HeroDemo_Light.mov"}
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
