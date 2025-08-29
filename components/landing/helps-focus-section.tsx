"use client"

import { Target } from "lucide-react"

export function HelpsFocusSection() {
  return (
    <section className="pt-0 pb-32 bg-gradient-to-b from-background via-blue-50/5 to-background dark:from-background dark:via-blue-950/10 dark:to-background">
      <div className="container max-w-5xl mx-auto px-8">
        {/* Section title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            A beautiful way to focus.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Focus Mode feeds you one task at a time in a beautiful interface.
          </p>
        </div>
        
        {/* Large visual representation of Focus Mode */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-50"></div>
          
          {/* Main focus mode visual */}
          <div className="relative bg-gradient-to-br from-background to-muted/20 rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
            {/* Minimal UI chrome */}
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
                </div>
                <div className="text-sm text-muted-foreground">Focus Mode</div>
              </div>
              <Target className="w-5 h-5 text-primary" />
            </div>
            
            {/* The focused task - clean and centered */}
            <div className="p-20 sm:p-32 flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50/5 via-transparent to-purple-50/5 dark:from-blue-950/5 dark:to-purple-950/5">
              <div className="text-center space-y-8">
                {/* Single task display */}
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground/90 leading-relaxed">
                  Write introduction paragraph
                </h3>
                
                {/* Simple action buttons */}
                <div className="flex items-center justify-center space-x-6">
                  <button className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                    Complete
                  </button>
                  <button className="px-8 py-3 rounded-full border border-border/50 text-muted-foreground hover:bg-muted/20 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            </div>
            
            {/* Subtle gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/20 to-transparent pointer-events-none"></div>
          </div>
        </div>
        
        {/* Additional context */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground">
            You can also use it like a normal to-do app - it&apos;s beautiful either way!
          </p>
        </div>
      </div>
    </section>
  )
}