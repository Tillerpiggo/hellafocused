import { Button } from "@/components/ui/button"
import { Check, Shuffle, X } from "lucide-react"
import { useEffect, useState } from "react"
import { triggerConfetti } from "@/lib/confetti"
import { FocusContextMenu } from "./focus-context-menu"
import { TaskBreadcrumb } from "./task-breadcrumb"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import { getTaskParentChain } from "@/lib/task-utils"

interface FocusTaskViewProps {
  currentTask: { id: string; name: string; priority: number; description?: string } | null
  completeFocusTask: () => void
  getNextFocusTask: () => void
  onToggleDefer: () => void
  onTogglePrefer: () => void
  showInfoOverlay?: boolean
  onShowInfoOverlay?: (show: boolean) => void
}

export function FocusTaskView({
  currentTask,
  completeFocusTask,
  getNextFocusTask,
  onToggleDefer,
  onTogglePrefer,
  showInfoOverlay: externalShowInfoOverlay,
  onShowInfoOverlay
}: FocusTaskViewProps) {
  const priority = currentTask?.priority ?? 0
  const [isCompleting, setIsCompleting] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [taskKey, setTaskKey] = useState(0)
  const [displayedTaskName, setDisplayedTaskName] = useState("")
  const [displayedTaskId, setDisplayedTaskId] = useState("")
  // const [displayedTaskDescription, setDisplayedTaskDescription] = useState<string | undefined>(undefined)
  const [internalShowInfoOverlay, setInternalShowInfoOverlay] = useState(false)
  const [isOverlayClosing, setIsOverlayClosing] = useState(false)
  
  // Use external control if provided, otherwise use internal state
  const showInfoOverlay = externalShowInfoOverlay !== undefined ? externalShowInfoOverlay : internalShowInfoOverlay
  const setShowInfoOverlay = onShowInfoOverlay || setInternalShowInfoOverlay
  
  // Get parent chain for breadcrumb
  const projects = useAppStore((state) => state.projects)
  const parentChain = currentTask ? getTaskParentChain(projects, currentTask.id) : []

  // Update displayed task name when current task changes (but not during completion or transition)
  useEffect(() => {
    if (currentTask && !isCompleting && !isTransitioning) {
      // Only update taskKey (trigger animation) if the task ID actually changed
      if (currentTask.id !== displayedTaskId) {
        setDisplayedTaskName(currentTask.name)
        // setDisplayedTaskDescription(currentTask.description)
        setDisplayedTaskId(currentTask.id)
        setTaskKey((prev) => prev + 1)
      }
    }
  }, [currentTask, isCompleting, isTransitioning, displayedTaskId])

  const handleCompleteTask = () => {
    if (isCompleting || !currentTask) return

    setIsCompleting(true)
    setIsTransitioning(true)

    // Trigger confetti
    triggerConfetti()

    // Complete task in backend immediately
    completeFocusTask()

    // Wait for slide-out animation to complete (0.4s) before getting next task
    setTimeout(() => {
      getNextFocusTask()
      setIsTransitioning(false)
      setIsCompleting(false)
    }, 450) // Slightly longer than the 0.4s slideUpOut animation
  }

  const handleGetNextTask = () => {
    if (isCompleting) return

    setIsTransitioning(true)

    // Wait for slide-out animation to complete before getting next task
    setTimeout(() => {
      getNextFocusTask()
      setIsTransitioning(false)
    }, 450)
  }

  const handleCloseOverlay = () => {
    setIsOverlayClosing(true)
    setTimeout(() => {
      setShowInfoOverlay(false)
      setIsOverlayClosing(false)
    }, 450)
  }

  return (
    <>
      {/* Main content area with task title - centered vertically and horizontally */}
      <FocusContextMenu
        onComplete={handleCompleteTask}
        onNext={handleGetNextTask}
        onToggleDefer={onToggleDefer}
        onTogglePrefer={onTogglePrefer}
        isDeferred={currentTask?.priority === -1}
        isPreferred={currentTask?.priority === 1}
      >
        <div className={`flex-1 flex items-center justify-center p-8 overflow-hidden transition-colors duration-500 ease-out relative ${
          priority === 1 
            ? "bg-amber-50/30 dark:bg-amber-950/10" 
            : priority === -1 
            ? "bg-muted/20 dark:bg-muted/10" 
            : ""
        }`}>
          {/* Subtle gradient glow effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Top left glow - balanced subtlety */}
            <div className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/12 via-blue-300/5 to-transparent rounded-full blur-[100px] opacity-40 dark:from-blue-500/8 dark:via-blue-400/3"></div>
            
            {/* Bottom right glow - balanced subtlety */}
            <div className="absolute -bottom-60 -right-60 w-[500px] h-[500px] bg-gradient-to-tl from-purple-400/12 via-purple-300/5 to-transparent rounded-full blur-[100px] opacity-40 dark:from-purple-500/8 dark:via-purple-400/3"></div>
            
            {/* Center subtle radial gradient */}
            <div className="absolute inset-0 bg-radial-gradient from-primary/[0.03] via-transparent to-transparent"></div>
            
            {/* Subtle animated floating orb - top center */}
            <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] opacity-20">
              <div className="w-full h-full bg-gradient-to-br from-pink-300/10 to-orange-300/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '12s' }}></div>
            </div>
            
            {/* Priority-specific enhanced glows - balanced */}
            {priority === 1 && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-300/[0.06] via-transparent to-transparent"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-radial from-amber-400/[0.07] to-transparent rounded-full blur-[120px]"></div>
              </>
            )}
            
            {priority === -1 && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/[0.03] via-transparent to-transparent"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-slate-300/[0.04] to-transparent rounded-full blur-[120px]"></div>
              </>
            )}
          </div>
          
          <div className="relative max-w-4xl w-full z-10">
            <h1
              key={taskKey}
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-center leading-relaxed break-words transition-colors duration-500 ease-out ${
                isTransitioning ? "animate-slide-up-out" : "animate-slide-up-in"
              } ${
                priority === 1 
                  ? "text-amber-800/90 dark:text-amber-200/95" 
                  : priority === -1 
                  ? "text-muted-foreground" 
                  : "text-foreground"
              }`}
            >
              {displayedTaskName || (currentTask?.name || "")}
            </h1>
          </div>
        </div>
      </FocusContextMenu>

      {/* Glassy Info Overlay */}
      {showInfoOverlay && currentTask && (
        <div 
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-8",
            "transition-opacity duration-300",
            isOverlayClosing ? "opacity-0" : "opacity-100"
          )}
          onClick={handleCloseOverlay}
        >
          {/* Backdrop blur with subtle darkening - cross-browser support */}
          <div className="absolute inset-0 overlay-backdrop" />
          
          {/* Content card - glass-morphism with transitions instead of animations */}
          <div 
            className={cn(
              "relative max-w-3xl w-full glass-morphism rounded-3xl p-8 shadow-2xl",
              "transition-all duration-300 transform",
              isOverlayClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseOverlay}
                className="absolute top-4 right-4 rounded-full hover:bg-white/20 dark:hover:bg-black/20"
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Breadcrumb navigation - with margin to avoid close button */}
              {parentChain.length > 0 && (
                <div className="mb-4">
                  <TaskBreadcrumb 
                    items={parentChain}
                    currentTaskName={currentTask.name}
                    className="animate-in fade-in slide-in-from-top-2 duration-500"
                  />
                </div>
              )}
              
              {/* Task name - always with right padding for close button */}
              <h2 className="text-2xl font-medium mb-6 pr-12">
                {currentTask.name}
              </h2>
              
              {/* Description section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </h3>
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {currentTask.description || "No description."}
                </p>
              </div>
              
              {/* Placeholder for future sections */}
              <div className="mt-8 pt-6 border-t border-white/10 dark:border-white/5">
                <p className="text-xs text-muted-foreground text-center">
                  Attachments, due dates, and more coming soon
                </p>
              </div>
          </div>
        </div>
      )}

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