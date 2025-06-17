import { Button } from "@/components/ui/button"
import { Check, Shuffle } from "lucide-react"
import { useEffect, useState } from "react"
import { triggerConfetti } from "@/lib/confetti"

interface FocusTaskViewProps {
  currentTask: { id: string; name: string } | null
  completeFocusTask: () => void
  getNextFocusTask: () => void
}

export function FocusTaskView({
  currentTask,
  completeFocusTask,
  getNextFocusTask
}: FocusTaskViewProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [taskKey, setTaskKey] = useState(0)
  const [displayedTaskName, setDisplayedTaskName] = useState("")

  // Update displayed task name when current task changes (but not during completion)
  useEffect(() => {
    if (currentTask && !isCompleting) {
      setDisplayedTaskName(currentTask.name)
      setTaskKey((prev) => prev + 1)
    }
  }, [currentTask, isCompleting])

  const handleCompleteTask = () => {
    if (isCompleting || !currentTask) return

    setIsCompleting(true)

    // Trigger confetti
    triggerConfetti()

    // Start transition animation
    setIsTransitioning(true)

    // Complete task in backend but delay getting next task
    completeFocusTask()

    // After animation, get next task and update display
    setTimeout(() => {
      getNextFocusTask()
      setIsTransitioning(false)
      setIsCompleting(false)
    }, 0)
  }

  const handleGetNextTask = () => {
    if (isCompleting) return

    setIsTransitioning(true)

    setTimeout(() => {
      getNextFocusTask()
      setIsTransitioning(false)
    }, 0)
  }
  return (
    <>
      {/* Main content area with task title - centered vertically and horizontally */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div className="relative max-w-4xl w-full">
          <h1
            key={taskKey}
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-foreground text-center leading-relaxed break-words transition-all duration-300 ease-out ${
              isTransitioning ? "animate-slide-up-out" : "animate-slide-up-in"
            }`}
          >
            {displayedTaskName || (currentTask?.name || "")}
          </h1>
        </div>
      </div>

      {/* Bottom action buttons */}
      <div className="flex flex-col sm:flex-row gap-6 p-8 max-w-md mx-auto w-full">
        <Button
          size="lg"
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
          onClick={handleCompleteTask}
          disabled={isCompleting}
        >
          <Check className="mr-2 h-5 w-5" />
          Complete
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 py-4 rounded-full transition-all duration-300 hover:scale-105 border-2"
          onClick={handleGetNextTask}
          disabled={isCompleting}
        >
          <Shuffle className="mr-2 h-5 w-5" />
          Next
        </Button>
      </div>
    </>
  )
} 