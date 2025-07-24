import { Button } from "@/components/ui/button"
import { PartyPopper, ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"

interface AllTasksCompletedViewProps {
  onKeepGoing: () => void
}

export function AllTasksCompletedView({ onKeepGoing }: AllTasksCompletedViewProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 transition-all ease-out ${
      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
    }`}
         style={{ transitionDuration: '1200ms' }}>
      <div className="w-24 h-24 sm:w-32 sm:h-32 mb-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
        <PartyPopper className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
      </div>
      <h2 className="text-3xl sm:text-4xl font-light mb-4 text-foreground">Beautiful work</h2>
      <p className="text-muted-foreground text-lg sm:text-xl mb-12 max-w-md leading-relaxed">
        All tasks in this section are complete. Take a moment to appreciate your progress.
      </p>
      <Button
        size="lg"
        className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
        onClick={onKeepGoing}
      >
        <ArrowUp className="mr-2 h-5 w-5" />
        Continue Journey
      </Button>
    </div>
  )
} 