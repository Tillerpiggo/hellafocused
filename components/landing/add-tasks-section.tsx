"use client"

import { useEffect, useState } from "react"

export function AddTasksSection() {
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

  return (
    <section className="min-h-screen flex flex-col bg-muted/20">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16 py-20">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
            Add tasks without losing focus.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto mt-6">
            Hit the "+" button to capture new ideas or break down what you're working on.
          </p>
        </div>

        {/* Full screen visual area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-6xl rounded-3xl border border-border/50 overflow-hidden shadow-2xl relative">
            <video
              key={isDark ? 'dark' : 'light'}
              src={isDark ? "/AddDemo_Dark.mov" : "/AddDemo_Light.mov"}
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
    </section>
  )
} 