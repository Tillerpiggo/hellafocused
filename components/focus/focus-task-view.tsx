import { Button } from "@/components/ui/button"
import { Check, Shuffle } from "lucide-react"

interface FocusTaskViewProps {
  taskName: string
  displayedTaskName: string
  taskKey: number
  isTransitioning: boolean
  isCompleting: boolean
  onCompleteTask: () => void
  onGetNextTask: () => void
}

export function FocusTaskView({
  taskName,
  displayedTaskName,
  taskKey,
  isTransitioning,
  isCompleting,
  onCompleteTask,
  onGetNextTask
}: FocusTaskViewProps) {
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
            {displayedTaskName || taskName}
          </h1>
        </div>
      </div>

      {/* Bottom action buttons */}
      <div className="flex flex-col sm:flex-row gap-6 p-8 max-w-md mx-auto w-full">
        <Button
          size="lg"
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
          onClick={onCompleteTask}
          disabled={isCompleting}
        >
          <Check className="mr-2 h-5 w-5" />
          Complete
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 py-4 rounded-full transition-all duration-300 hover:scale-105 border-2"
          onClick={onGetNextTask}
          disabled={isCompleting}
        >
          <Shuffle className="mr-2 h-5 w-5" />
          Next
        </Button>
      </div>
    </>
  )
} 