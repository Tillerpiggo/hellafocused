import { Button } from "@/components/ui/button"
import { X, Plus, Star, Clock } from "lucide-react"
import { useEffect, useState } from "react"

interface FocusHeaderButtonsProps {
  onExitFocus: () => void
  onShowAddTasks: () => void
  currentTaskPriority?: number
}

export function FocusHeaderButtons({ onExitFocus, onShowAddTasks, currentTaskPriority = 0 }: FocusHeaderButtonsProps) {
  const [justBecamePreferred, setJustBecamePreferred] = useState(false)
  const [justBecameUnpreferred, setJustBecameUnpreferred] = useState(false)
  const [prevPriority, setPrevPriority] = useState(currentTaskPriority)

  // Track when task becomes preferred/unpreferred to trigger animations
  useEffect(() => {
    if (prevPriority !== 1 && currentTaskPriority === 1) {
      setJustBecamePreferred(true)
      setJustBecameUnpreferred(false) // Clear unprefer state
      const timer = setTimeout(() => setJustBecamePreferred(false), 600)
      return () => clearTimeout(timer)
    } else if (prevPriority === 1 && currentTaskPriority !== 1) {
      setJustBecameUnpreferred(true)
      setJustBecamePreferred(false) // Clear preferred state
      const timer = setTimeout(() => setJustBecameUnpreferred(false), 500)
      return () => clearTimeout(timer)
    }
    setPrevPriority(currentTaskPriority)
  }, [currentTaskPriority, prevPriority])

  return (
    <>
      {/* Exit button in top left */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 left-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
        onClick={onExitFocus}
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Exit focus mode</span>
      </Button>

      {/* Add tasks button in top right */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        {/* Priority indicator */}
        {(currentTaskPriority === 1 || justBecameUnpreferred) && (
          <div className="h-10 w-10 rounded-full flex items-center justify-center opacity-80">
            <Star className={`h-4 w-4 text-amber-600 fill-amber-600 dark:text-amber-400 dark:fill-amber-400 transition-transform duration-300 ease-out ${
              justBecamePreferred ? "animate-bounce-scale" : 
              justBecameUnpreferred ? "animate-shrink-fade" : ""
            }`} />
          </div>
        )}
        {currentTaskPriority === -1 && (
          <div className="h-10 w-10 rounded-full flex items-center justify-center opacity-60">
            <Clock className="h-4 w-4 text-slate-500/80 dark:text-slate-400/80" />
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity"
          onClick={onShowAddTasks}
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">Add tasks</span>
        </Button>
      </div>
    </>
  )
} 