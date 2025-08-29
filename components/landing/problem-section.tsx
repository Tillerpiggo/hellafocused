"use client"

import { ListX, Brain } from "lucide-react"

export function ProblemSection() {
  return (
    <section className="pt-32 pb-32 bg-gradient-to-b from-background via-rose-50/5 to-background dark:from-background dark:via-rose-950/10 dark:to-background overflow-hidden">
      <div className="container max-w-6xl mx-auto px-8">
        {/* Face it - lead in */}
        <div className="text-center mb-16">
          <p className="text-2xl text-muted-foreground/70 font-light italic">Face it.</p>
        </div>
        
        {/* Main title with bold statement */}
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-8">
            Your to-do app is overwhelming.
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-rose-500 to-pink-500 mx-auto rounded-full" />
        </div>
        
        {/* Two main problems in beautiful cards */}
        <div className="grid gap-12 lg:gap-16 md:grid-cols-2 max-w-5xl mx-auto">
          {/* Lists are overwhelming */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-70" />
            <div className="relative bg-background/80 backdrop-blur-xl rounded-3xl p-10 border border-border/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 h-full flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 mb-6">
                <ListX className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Lists are overwhelming
              </h3>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Long to-do lists cause anxiety, not clarity.
              </p>
              
              {/* Visual representation - more prominent */}
              <div className="mt-auto space-y-3">
                <div className="h-3 bg-gradient-to-r from-rose-400/40 to-rose-300/30 rounded-full animate-pulse" />
                <div className="h-3 bg-gradient-to-r from-rose-400/35 to-rose-300/25 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="h-3 bg-gradient-to-r from-rose-400/30 to-rose-300/20 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="h-3 bg-gradient-to-r from-rose-400/25 to-rose-300/15 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                <div className="h-3 bg-gradient-to-r from-rose-400/20 to-rose-300/10 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
                <div className="h-3 bg-gradient-to-r from-rose-400/15 to-rose-300/10 rounded-full animate-pulse" style={{ animationDelay: '750ms' }} />
              </div>
            </div>
          </div>
          
          {/* Tasks are overwhelming */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-70" />
            <div className="relative bg-background/80 backdrop-blur-xl rounded-3xl p-10 border border-border/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 h-full flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 mb-6">
                <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Tasks are overwhelming
              </h3>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Large tasks are paralyzing. They need to be broken down.
              </p>
              
              {/* Visual representation - abstract overwhelming shape */}
              <div className="mt-auto">
                <div className="relative h-24">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/25 rounded-3xl transform rotate-3 scale-105"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/35 to-blue-500/30 rounded-3xl transform -rotate-2 scale-95"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/40 to-purple-400/35 rounded-3xl shadow-lg backdrop-blur-sm"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/15 rounded-3xl animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Closing statement - more prominent and balanced */}
        <div className="text-center mt-24">
          <div className="inline-block">
            <p className="text-2xl sm:text-3xl font-light text-foreground/90 mb-3">
              You deserve an upgrade.
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-primary/60 via-purple-500/60 to-pink-500/60 mx-auto rounded-full" />
          </div>
        </div>
      </div>
    </section>
  )
}