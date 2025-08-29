"use client"

export function ReliefSection() {
  return (
    <section className="py-32 bg-gradient-to-b from-background via-green-50/5 to-background dark:from-background dark:via-green-950/10 dark:to-background">
      <div className="container max-w-5xl mx-auto px-8">
        {/* Section title */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Feel the relief.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Anxiety melts when you use a clean interface.
          </p>
        </div>
        
        {/* Visual representation of calm/relief */}
        <div className="relative max-w-4xl mx-auto">
          {/* Soft gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5 blur-3xl" />
          
          {/* Main visual - zen-like interface preview */}
          <div className="relative bg-gradient-to-br from-background/95 to-muted/20 rounded-3xl border border-border/30 shadow-xl overflow-hidden">
            {/* Clean, minimal UI elements */}
            <div className="p-12 space-y-8">
              {/* Single, calm task */}
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-4 bg-white/50 dark:bg-white/5 rounded-2xl px-8 py-6 border border-green-200/30 dark:border-green-800/30">
                  <div className="w-6 h-6 rounded-full border-2 border-green-500/50" />
                  <span className="text-lg text-foreground/80">Take a deep breath</span>
                </div>
              </div>
              
              {/* Breathing animation circles */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400/10 to-emerald-400/10 animate-pulse" style={{ animationDuration: '4s' }} />
                  <div className="absolute inset-4 w-24 h-24 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-400/20 animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
                  <div className="absolute inset-8 w-16 h-16 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-400/30 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                </div>
              </div>
              
              {/* Simple action buttons */}
              <div className="flex items-center justify-center space-x-6">
                <button className="px-8 py-3 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">
                  Done
                </button>
                <button className="px-8 py-3 rounded-full text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  Skip
                </button>
              </div>
            </div>
            
            {/* Subtle floating elements for depth */}
            <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-gradient-to-br from-green-400/5 to-emerald-400/5 blur-xl" />
            <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-gradient-to-br from-teal-400/5 to-green-400/5 blur-xl" />
          </div>
        </div>
        
        {/* Bottom text */}
        <div className="text-center mt-20">
          <p className="text-lg text-muted-foreground">
            No clutter. No decisions. Just peace.
          </p>
        </div>
      </div>
    </section>
  )
}