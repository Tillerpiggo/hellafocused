import { Button } from "@/components/ui/button"
import { X, Plus, Star, Clock, Info, FileText, Timer } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { PriorityDropdown } from "./priority-dropdown"
import { TimerPicker, formatRemainingFull } from "./timer-picker"
import { cn } from "@/lib/utils"

interface FocusHeaderButtonsProps {
  onExitFocus: () => void
  onShowAddTasks: () => void
  currentTaskPriority?: number
  onPriorityChange?: (priority: number) => void
  onShowTaskDetails?: () => void
  hasDescription?: boolean
  isTransitioning?: boolean
  timerDisplay?: { label: string; isLastMinute: boolean } | null
  timerFired?: boolean
  hasActiveTimer?: boolean
  timerEndTime?: number | null
  onSetTimer?: (durationMs: number) => void
  onClearTimer?: () => void
  onAcknowledgeTimer?: () => void
}

export function FocusHeaderButtons({
  onExitFocus,
  onShowAddTasks,
  currentTaskPriority = 0,
  onPriorityChange,
  onShowTaskDetails,
  hasDescription,
  isTransitioning,
  timerDisplay,
  timerFired,
  hasActiveTimer,
  timerEndTime,
  onSetTimer,
  onClearTimer,
  onAcknowledgeTimer,
}: FocusHeaderButtonsProps) {
  const [timerDismissing, setTimerDismissing] = useState(false)
  const [timerHovered, setTimerHovered] = useState(false)
  const timerShortRef = useRef<HTMLSpanElement>(null)
  const timerFullRef = useRef<HTMLSpanElement>(null)
  const [timerLabelWidth, setTimerLabelWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    const short = timerShortRef.current?.offsetWidth
    const full = timerFullRef.current?.offsetWidth
    setTimerLabelWidth(timerHovered && full ? full : short)
  }, [timerHovered, timerDisplay?.label, timerEndTime])

  const handleTimerDismiss = () => {
    setTimerDismissing(true)
    setTimeout(() => {
      onAcknowledgeTimer?.()
      setTimerDismissing(false)
    }, 500)
  }

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
              <Star className={`h-4 w-4 text-priority-icon fill-priority-fill transition-transform duration-300 ease-out ${
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

        {/* Timer button — fired state is a plain dismiss button, otherwise dropdown trigger */}
        {onSetTimer && onClearTimer && (
          (timerFired || timerDismissing) ? (
            <div
              role="button"
              tabIndex={0}
              onClick={!timerDismissing ? handleTimerDismiss : undefined}
              onKeyDown={(e) => { if (!timerDismissing && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); handleTimerDismiss() } }}
              className={cn(
                "h-10 rounded-full flex items-center gap-1.5 px-3 cursor-pointer transition-all duration-500 ease-in-out",
                timerDismissing
                  ? "opacity-0"
                  : "opacity-80 hover:opacity-100"
              )}
            >
              <div className="relative flex-shrink-0">
                <Timer className={cn("h-4 w-4 transition-colors duration-500 ease-in-out", timerDismissing ? "text-foreground" : "text-primary")} />
                <span className={cn(
                  "absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary transition-all duration-500 ease-in-out",
                  timerDismissing ? "scale-0 opacity-0" : "scale-100 opacity-100"
                )} />
              </div>
              <span className={cn(
                "text-xs font-medium text-primary whitespace-nowrap transition-opacity duration-300 ease-in-out",
                timerDismissing ? "opacity-0" : "opacity-100"
              )}>Timer done</span>
            </div>
          ) : (
            <TimerPicker
              hasActiveTimer={hasActiveTimer ?? false}
              timerEndTime={timerEndTime}
              onSetTimer={onSetTimer}
              onClearTimer={onClearTimer}
            >
              <div
                onMouseEnter={() => setTimerHovered(true)}
                onMouseLeave={() => setTimerHovered(false)}
                className={cn(
                  "h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out gap-1.5",
                  timerDisplay ? "px-3" : "w-10",
                  !timerDisplay && "opacity-50 hover:opacity-100",
                )}
              >
                <Timer className="h-4 w-4 text-foreground" />
                {timerDisplay && (
                  <span
                    className="relative inline-block overflow-hidden align-middle text-xs font-medium tabular-nums text-muted-foreground transition-[width] duration-300 ease-in-out"
                    style={{ width: timerLabelWidth }}
                  >
                    <span
                      ref={timerShortRef}
                      className={cn(
                        "inline-block whitespace-nowrap transition-opacity duration-300 ease-in-out",
                        timerHovered && timerEndTime ? "opacity-0" : "opacity-100"
                      )}
                    >
                      {timerDisplay.label}
                    </span>
                    {timerEndTime && (
                      <span
                        ref={timerFullRef}
                        className={cn(
                          "absolute left-0 top-0 whitespace-nowrap transition-opacity duration-300 ease-in-out",
                          timerHovered ? "opacity-100" : "opacity-0"
                        )}
                      >
                        {formatRemainingFull(timerEndTime - Date.now())}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </TimerPicker>
          )
        )}

        {/* Task details button */}
        {onShowTaskDetails && (
          <Button
            variant="ghost"
            onClick={onShowTaskDetails}
            className={cn(
              "rounded-full px-3 py-2 h-10",
              "bg-focusAction/10 dark:bg-focusAction/10",
              "hover:bg-focusAction/20 dark:hover:bg-focusAction/20",
              "backdrop-blur-sm transition-all duration-[2500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
              "border border-focusAction/30 dark:border-focusAction/20",
              "opacity-80 hover:opacity-100",
              isTransitioning && "pointer-events-none"
            )}
          >
            <Info className="h-4 w-4 text-focusAction dark:text-focusAction mr-2" />
            <span className="text-sm font-medium text-focusAction dark:text-focusAction">
              Show task details
            </span>
            
            {/* Icons showing available details with smooth transitions */}
            <div className={cn(
              "flex items-center transition-all duration-[2500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden",
              showDescriptionIcon ? "ml-3 max-w-[40px] opacity-100" : "ml-0 max-w-0 opacity-0"
            )}>
              <div className={cn(
                "pl-3 border-l flex items-center transition-all duration-[2500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                showDescriptionIcon ? "border-focusAction/30 dark:border-focusAction/30" : "border-transparent"
              )}>
                <FileText className={cn(
                  "h-4 w-4 text-focusAction/60 dark:text-focusAction/60 transition-all duration-[2500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
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