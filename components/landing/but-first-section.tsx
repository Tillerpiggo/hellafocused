"use client"

export function ButFirstSection() {
  return (
    <section className="py-32 bg-gradient-to-b from-background to-background">
      <div className="container max-w-5xl mx-auto px-8">
        {/* Section title */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Break down scary tasks.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Hellafocused supports nested subtasks, so you can break down tasks until they&apos;re approachable.
          </p>
        </div>
        
        {/* Hierarchical breakdown visualization */}
        <div className="relative max-w-5xl mx-auto">
          {/* Level 1: Large overwhelming block */}
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="w-80 h-24 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl border-2 border-red-500/20 flex items-center justify-center backdrop-blur-sm">
                <span className="text-base font-medium text-red-600/70 dark:text-red-400/70">Write blog post</span>
              </div>
              <div className="absolute inset-0 bg-red-500/5 rounded-2xl animate-pulse" />
            </div>
          </div>
          
          {/* Connection lines */}
          <svg className="w-full h-16 overflow-visible" viewBox="0 0 400 64">
            <path
              d="M 200 0 L 200 20 L 100 64 M 200 20 L 200 64 M 200 20 L 300 64"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-border/50"
            />
          </svg>
          
          {/* Level 2: Medium blocks */}
          <div className="grid grid-cols-3 gap-4 mb-4 px-8">
            <div className="w-full h-16 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center">
              <span className="text-xs text-amber-600/60 dark:text-amber-400/60 text-center px-2">Research</span>
            </div>
            <div className="w-full h-16 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center">
              <span className="text-xs text-amber-600/60 dark:text-amber-400/60 text-center px-2">Write draft</span>
            </div>
            <div className="w-full h-16 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center">
              <span className="text-xs text-amber-600/60 dark:text-amber-400/60 text-center px-2">Edit & publish</span>
            </div>
          </div>
          
          {/* More connection lines */}
          <div className="grid grid-cols-3 gap-4 px-8">
            <svg className="w-full h-12" viewBox="0 0 100 48">
              <path
                d="M 50 0 L 25 48 M 50 0 L 50 48 M 50 0 L 75 48"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="text-border/30"
              />
            </svg>
            <svg className="w-full h-12" viewBox="0 0 100 48">
              <path
                d="M 50 0 L 25 48 M 50 0 L 50 48 M 50 0 L 75 48"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="text-border/30"
              />
            </svg>
            <svg className="w-full h-12" viewBox="0 0 100 48">
              <path
                d="M 50 0 L 25 48 M 50 0 L 50 48 M 50 0 L 75 48"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="text-border/30"
              />
            </svg>
          </div>
          
          {/* Level 3: Small actionable blocks */}
          <div className="grid grid-cols-3 gap-4 px-4">
            <div className="grid grid-cols-3 gap-1">
              <div className="w-full h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded border border-green-500/30 hover:scale-105 transition-transform cursor-pointer" />
              <div className="w-full h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded border border-green-500/30 hover:scale-105 transition-transform cursor-pointer" />
              <div className="w-full h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded border border-green-500/30 hover:scale-105 transition-transform cursor-pointer" />
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="w-full h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded border border-green-500/30 hover:scale-105 transition-transform cursor-pointer" />
              <div className="w-full h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded border border-green-500/30 hover:scale-105 transition-transform cursor-pointer" />
              <div className="w-full h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded border border-green-500/30 hover:scale-105 transition-transform cursor-pointer" />
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="w-full h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded border border-green-500/30 hover:scale-105 transition-transform cursor-pointer" />
              <div className="w-full h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded border border-green-500/30 hover:scale-105 transition-transform cursor-pointer" />
              <div className="w-full h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded border border-green-500/30 hover:scale-105 transition-transform cursor-pointer" />
            </div>
          </div>
          
          {/* Example text for one tiny task */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center space-x-2 bg-green-500/10 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                &quot;Open Google Docs&quot;
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  )
}