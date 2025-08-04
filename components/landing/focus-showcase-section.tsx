"use client"

import { useTheme } from "next-themes"

export function FocusShowcaseSection() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <section className="min-h-screen flex flex-col bg-primary/5">
      <div className="container max-w-screen-xl mx-auto px-8 sm:px-12 lg:px-16 py-20">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
            Hyperfocus on the task at hand.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto mt-6">
            Focus Mode continually presents you with a random choice from the smallest subtasks (the leaf nodes), making it easy to get in a flow state.
          </p>
        </div>

        {/* Full screen visual area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-6xl rounded-3xl border border-border/50 overflow-hidden shadow-2xl relative">
            <video
              key={isDark ? 'dark' : 'light'}
              src={isDark ? "/FocusDemo_Dark.mov" : "/FocusDemo_Light.mov"}
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
