import { Button } from "@/components/ui/button"
import { X, Plus, Star, Clock, Info, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { PriorityDropdown } from "./priority-dropdown"
import { cn } from "@/lib/utils"

interface FocusHeaderButtonsProps {
  onExitFocus: () => void
  onShowAddTasks: () => void
  currentTaskPriority?: number
  onPriorityChange?: (priority: number) => void
  onShowTaskDetails?: () => void
  hasDescription?: boolean
  isTransitioning?: boolean
}

export function FocusHeaderButtons({ 
  onExitFocus, 
  onShowAddTasks, 
  currentTaskPriority = 0, 
  onPriorityChange,
  onShowTaskDetails,
  hasDescription,
  isTransitioning
}: FocusHeaderButtonsProps) {
  const [justBecamePreferred, setJustBecamePreferred] = useState(false)
  const [justBecameUnpreferred, setJustBecameUnpreferred] = useState(false)
  const [prevPriority, setPrevPriority] = useState(currentTaskPriority)
  const [showDescriptionIcon, setShowDescriptionIcon] = useState(hasDescription)
  const [prevHasDescription, setPrevHasDescription] = useState(hasDescription)

  // Handle description icon animation during transitions
  useEffect(() => {
    // When transition starts, begin animating if description state will change
    if (isTransitioning && hasDescription !== prevHasDescription) {
      // Start animating immediately when transition begins
      setShowDescriptionIcon(hasDescription)
    } else if (!isTransitioning) {
      // Update state when not transitioning
      setShowDescriptionIcon(hasDescription)
      setPrevHasDescription(hasDescription)
    }
  }, [hasDescription, isTransitioning, prevHasDescription])

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

      {/* Buttons in top right */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        {/* Priority indicator */}
        {(currentTaskPriority === 1 || justBecameUnpreferred) && onPriorityChange && (
          <PriorityDropdown currentPriority={currentTaskPriority} onPriorityChange={onPriorityChange}>
            <div className="h-10 w-10 rounded-full flex items-center justify-center opacity-80 hover:opacity-100 cursor-pointer transition-opacity">
              <Star className={`h-4 w-4 text-amber-600 fill-amber-600 dark:text-amber-400 dark:fill-amber-400 transition-transform duration-300 ease-out ${
                justBecamePreferred ? "animate-bounce-scale" : 
                justBecameUnpreferred ? "animate-shrink-fade" : ""
              }`} />
            </div>
          </PriorityDropdown>
        )}
        {currentTaskPriority === -1 && onPriorityChange && (
          <PriorityDropdown currentPriority={currentTaskPriority} onPriorityChange={onPriorityChange}>
            <div className="h-10 w-10 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 cursor-pointer transition-opacity">
              <Clock className="h-4 w-4 text-slate-500/80 dark:text-slate-400/80" />
            </div>
          </PriorityDropdown>
        )}
        
        {/* Task details button */}
        {onShowTaskDetails && (
          <Button
            variant="ghost"
            onClick={onShowTaskDetails}
            className={cn(
              "rounded-full px-3 py-2 h-10",
              "bg-rose-100/40 dark:bg-rose-900/10",
              "hover:bg-rose-200/50 dark:hover:bg-rose-800/20",
              "backdrop-blur-sm transition-all duration-[2500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
              "border border-rose-200/30 dark:border-rose-800/20",
              "opacity-80 hover:opacity-100",
              isTransitioning && "pointer-events-none"
            )}
          >
            <Info className="h-4 w-4 text-rose-700 dark:text-rose-300 mr-2" />
            <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
              Show task details
            </span>
            
            {/* Icons showing available details with smooth transitions */}
            <div className={cn(
              "flex items-center transition-all duration-[2500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden",
              showDescriptionIcon ? "ml-3 max-w-[40px] opacity-100" : "ml-0 max-w-0 opacity-0"
            )}>
              <div className={cn(
                "pl-3 border-l flex items-center transition-all duration-[2500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                showDescriptionIcon ? "border-rose-300/30 dark:border-rose-700/30" : "border-transparent"
              )}>
                <FileText className={cn(
                  "h-4 w-4 text-rose-600/60 dark:text-rose-400/60 transition-all duration-[2500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                  showDescriptionIcon ? "scale-100" : "scale-75 opacity-0"
                )} />
              </div>
            </div>
          </Button>
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