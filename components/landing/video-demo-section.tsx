import { useTheme } from "next-themes"

export function VideoDemoSection() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <section id="how-it-works" className="py-20">
      <div className="container max-w-6xl mx-auto px-8 sm:px-12 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Break tasks into infinitely nested subtasks.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto mt-6">
            With infinite nesting, it&apos;s easy to make your to-dos smaller... and smaller... and smaller...
          </p>
        </div>

        {/* Video Container */}
        <div className="relative">
          <div className="rounded-3xl border border-border/50 overflow-hidden shadow-2xl w-full mx-auto relative">
            <video
              key={isDark ? 'dark' : 'light'}
              src={isDark ? "/Breakdown_Dark.mov" : "/Breakdown_Light.mov"}
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
