"use client"

import { useTheme } from "next-themes"

export function AddTasksSection() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <section className="min-h-screen flex flex-col bg-muted/20">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16 py-20">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
            Add tasks without losing focus.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto mt-6">
            Hit the &quot;+&quot; button to add tasks without leaving focus mode.
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