import { useEffect, useState } from "react"

export function NoTasksAvailableView() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 transition-all ease-out ${
      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
    }`}
         style={{ transitionDuration: '1200ms' }}>
      <div className="w-24 h-24 mb-8 rounded-full bg-muted/50 flex items-center justify-center">
        <div className="w-3 h-3 bg-muted-foreground/30 rounded-full"></div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-light mb-4 text-muted-foreground">Peaceful moment</h2>
      <p className="text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed">
        No tasks await your attention right now. Rest in this quiet space.
      </p>
    </div>
  )
} 