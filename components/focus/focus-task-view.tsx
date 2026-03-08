import { Button } from "@/components/ui/button"
import { Check, Shuffle, X } from "lucide-react"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { triggerConfetti } from "@/lib/confetti"
import { FocusContextMenu } from "./focus-context-menu"
import { TaskBreadcrumb } from "./task-breadcrumb"
import { cn } from "@/lib/utils"
import { useAppStore, getOrderedTaskNumberMap } from "@/store/app-store"
import { useFocusStore, canShuffleCurrentTask } from "@/store/focus-store"
import { getTaskParentChain, findTaskPath, findTaskAtPath, getProjectId } from "@/lib/task-utils"
import { LinkifiedText } from "@/components/ui/linkified-text"
import { EditableTitle } from "@/components/editable-title"
import { TaskDescriptionEditor, type TaskDescriptionEditorRef } from "@/components/task/task-description-editor"
import { DueDatePicker } from "@/components/task/due-date-picker"
import { DueDateBadge } from "@/components/task/due-date-badge"
import { MultiplierBadge } from "./multiplier-badge"
import { MultiplierPreview } from "./multiplier-preview"
import { calculateDueDateMultiplier } from "@/lib/multiplier-utils"
import type { TaskData, MultiplierResult } from "@/lib/types"

interface FocusTaskViewProps {
  currentTask: TaskData | null
  completeFocusTask: () => void
  getNextFocusTask: () => void
  onToggleDefer: () => void
  onTogglePrefer: () => void
  showInfoOverlay?: boolean
  onShowInfoOverlay?: (show: boolean) => void
  startPath: string[]
}

export function FocusTaskView({
  currentTask,
  completeFocusTask,
  getNextFocusTask,
  onToggleDefer,
  onTogglePrefer,
  showInfoOverlay: externalShowInfoOverlay,
  onShowInfoOverlay,
  startPath
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
  const [showDescriptionEditor, setShowDescriptionEditor] = useState(false)
  const [showMultiplierBadge, setShowMultiplierBadge] = useState(false)
  const [completionMultiplier, setCompletionMultiplier] = useState<MultiplierResult | null>(null)
  const descriptionEditorRef = useRef<TaskDescriptionEditorRef>(null)
  
  // Use external control if provided, otherwise use internal state
  const showInfoOverlay = externalShowInfoOverlay !== undefined ? externalShowInfoOverlay : internalShowInfoOverlay
  const setShowInfoOverlay = onShowInfoOverlay || setInternalShowInfoOverlay
  
  // Get parent chain for breadcrumb and store functions
  const canShuffle = useFocusStore(canShuffleCurrentTask)
  const projects = useAppStore((state) => state.projects)
  const updateTaskName = useAppStore((state) => state.updateTaskName)
  const updateTaskDescription = useAppStore((state) => state.updateTaskDescription)
  const setTaskDueDate = useAppStore((state) => state.setTaskDueDate)
  const dueSoonDays = useAppStore((state) => state.dueSoonDays)
  const parentChain = currentTask ? getTaskParentChain(projects, currentTask.id) : []

  const multiplierResult = useMemo(() => {
    if (!currentTask) return { total: 1, breakdown: [] }
    return calculateDueDateMultiplier(currentTask, projects)
  }, [currentTask, projects])

  const orderedStepInfo = useMemo(() => {
    if (!currentTask) return null
    const projectId = getProjectId(startPath)
    if (!projectId) return null
    const project = projects.find(p => p.id === projectId)
    if (!project) return null
    const taskPathInProject = findTaskPath(project.tasks, currentTask.id)
    if (!taskPathInProject || taskPathInProject.length < 2) return null
    const parentPath = [projectId, ...taskPathInProject.slice(0, -1)]
    const parent = findTaskAtPath(projects, parentPath)
    if (!parent?.isOrdered) return null
    const orderMap = getOrderedTaskNumberMap(projects, parentPath)
    const orderNumber = orderMap[currentTask.id]
    if (orderNumber === undefined) return null
    return { current: orderNumber, total: parent.subtasks.length }
  }, [currentTask, projects, startPath])

  const handleDismissMultiplierBadge = useCallback(() => {
    setShowMultiplierBadge(false)
    setCompletionMultiplier(null)
  }, [])

  // Update displayed task name when current task changes (but not during completion or transition)
  useEffect(() => {
    if (currentTask && !isCompleting && !isTransitioning) {
      // Only update taskKey (trigger animation) if the task ID actually changed
      if (currentTask.id !== displayedTaskId) {
        setDisplayedTaskName(currentTask.name)
        // setDisplayedTaskDescription(currentTask.description)
        setDisplayedTaskId(currentTask.id)
        setTaskKey((prev) => prev + 1)
      } else if (currentTask.name !== displayedTaskName) {
        // Update name without animation if only the name changed (e.g., after editing)
        setDisplayedTaskName(currentTask.name)
      }
    }
  }, [currentTask, isCompleting, isTransitioning, displayedTaskId, displayedTaskName])

  const handleCompleteTask = () => {
    if (isCompleting || !currentTask) return

    setIsCompleting(true)
    setIsTransitioning(true)

    // Trigger confetti
    triggerConfetti()

    // Show multiplier badge if > x1
    if (multiplierResult.total > 1) {
      setCompletionMultiplier(multiplierResult)
      setShowMultiplierBadge(true)
    }

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
    }, 200) // Match animation duration
  }

  // Handle Escape key for overlay closing with animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showInfoOverlay) {
        handleCloseOverlay()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [showInfoOverlay])

  const handleTitleChange = (newTitle: string) => {
    if (!currentTask || !newTitle.trim()) return
    
    const projectId = getProjectId(startPath)
    if (!projectId) return
    
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      const taskPathInProject = findTaskPath(project.tasks, currentTask.id)
      if (taskPathInProject) {
        const fullTaskPath = [projectId, ...taskPathInProject]
        updateTaskName(fullTaskPath, newTitle)
        
        // Update the local currentFocusTask to reflect the change immediately
        useFocusStore.setState({ 
          currentFocusTask: { ...currentTask, name: newTitle } 
        })
      }
    }
  }

  const handleDescriptionSave = (newDescription: string) => {
    if (!currentTask) return
    
    const projectId = getProjectId(startPath)
    if (!projectId) return
    
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      const taskPathInProject = findTaskPath(project.tasks, currentTask.id)
      if (taskPathInProject) {
        const fullTaskPath = [projectId, ...taskPathInProject]
        updateTaskDescription(fullTaskPath, newDescription)
        
        // Update the local currentFocusTask to reflect the change immediately
        useFocusStore.setState({ 
          currentFocusTask: { ...currentTask, description: newDescription || undefined } 
        })
      }
    }
    setShowDescriptionEditor(false)
  }

  const handleDueDateChange = (date: string | undefined) => {
    if (!currentTask) return

    const projectId = getProjectId(startPath)
    if (!projectId) return

    const project = projects.find((p) => p.id === projectId)
    if (project) {
      const taskPathInProject = findTaskPath(project.tasks, currentTask.id)
      if (taskPathInProject) {
        const fullTaskPath = [projectId, ...taskPathInProject]
        setTaskDueDate(fullTaskPath, date)

        useFocusStore.setState({
          currentFocusTask: { ...currentTask, dueDate: date || undefined }
        })
      }
    }
  }

  const handleDescriptionCancel = () => {
    setShowDescriptionEditor(false)
  }

  return (
    <>
      {/* Main content area with task title and action buttons - centered vertically and horizontally */}
      <FocusContextMenu
        onComplete={handleCompleteTask}
        onNext={handleGetNextTask}
        onToggleDefer={onToggleDefer}
        onTogglePrefer={onTogglePrefer}
        onSetDueDate={() => setShowInfoOverlay(true)}
        hasDueDate={!!currentTask?.dueDate}
        isDeferred={currentTask?.priority === -1}
        isPreferred={currentTask?.priority === 1}
        canShuffle={canShuffle}
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
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-landing-warning/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '12s' }}></div>
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
          
          <div className="relative max-w-4xl w-full z-10 flex flex-col items-center">
            {orderedStepInfo ? (
              <div className={`flex flex-col items-center gap-5 ${multiplierResult.total > 1 ? 'mb-4' : 'mb-12'} ${
                isTransitioning ? "animate-slide-up-out" : "animate-slide-up-in"
              }`}>
                <span className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/15 text-primary text-2xl font-semibold">
                  {orderedStepInfo.current}
                </span>
                <EditableTitle
                  key={taskKey}
                  value={displayedTaskName || currentTask?.name || ""}
                  onChange={handleTitleChange}
                  className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-center leading-relaxed break-words transition-colors duration-500 ease-out ${
                    priority === 1
                      ? "text-priority-text"
                      : priority === -1
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }`}
                  placeholder="Task name"
                />
              </div>
            ) : (
              <EditableTitle
                key={taskKey}
                value={displayedTaskName || currentTask?.name || ""}
                onChange={handleTitleChange}
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-center leading-relaxed break-words transition-colors duration-500 ease-out ${multiplierResult.total > 1 ? 'mb-4' : 'mb-12'} ${
                  isTransitioning ? "animate-slide-up-out" : "animate-slide-up-in"
                } ${
                  priority === 1
                    ? "text-priority-text"
                    : priority === -1
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
                placeholder="Task name"
              />
            )}

            {multiplierResult.total > 1 && (
              <div className={`mb-8 ${isTransitioning ? "animate-slide-up-out" : "animate-slide-up-in"}`}>
                <MultiplierPreview result={multiplierResult} />
              </div>
            )}

            {/* Action buttons centered under the text */}
            <div className={cn("flex flex-col sm:flex-row gap-4 w-full", canShuffle ? "max-w-sm" : "max-w-xs")}>
              <Button
                size="lg"
                className={cn(
                  "flex-1 py-5 px-8 rounded-2xl transition-all duration-300",
                  "bg-complete hover:bg-completehover",
                  "text-completetext font-medium shadow-md hover:shadow-lg",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "border border-white/20"
                )}
                onClick={handleCompleteTask}
                disabled={isCompleting}
              >
                <Check className="mr-2 h-5 w-5" />
                Complete
              </Button>
              {canShuffle && (
                <Button
                  size="lg"
                  variant="ghost"
                  className={cn(
                    "flex-1 py-5 px-8 rounded-2xl transition-all duration-300",
                    "bg-white/60 hover:bg-white/80",
                    "dark:bg-white/10 dark:hover:bg-white/20",
                    "backdrop-blur-sm border border-primary/30",
                    "dark:border-primary/20",
                    "text-foreground font-medium",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    "shadow-md hover:shadow-lg"
                  )}
                  onClick={handleGetNextTask}
                  disabled={isCompleting}
                >
                  <Shuffle className="mr-2 h-5 w-5" />
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </FocusContextMenu>

      {/* Glassy Info Overlay */}
      {showInfoOverlay && currentTask && (
        <div 
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-8",
            isOverlayClosing 
              ? "animate-out fade-out duration-200" 
              : "animate-in fade-in duration-200"
          )}
          onClick={handleCloseOverlay}
        >
          {/* Backdrop blur with subtle darkening - cross-browser support */}
          <div className={cn(
            "absolute inset-0 overlay-backdrop",
            isOverlayClosing 
              ? "animate-out fade-out duration-200" 
              : "animate-in fade-in duration-200"
          )} />
          
          {/* Content card - opaque with fade/scale animations */}
          <div 
            className={cn(
              "relative max-w-3xl w-full bg-background rounded-3xl p-8 shadow-2xl",
              "border border-border",
              isOverlayClosing 
                ? "animate-out fade-out zoom-out-95 duration-200" 
                : "animate-in fade-in zoom-in-95 duration-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseOverlay}
                className="absolute top-4 right-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 z-50"
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
              
              {/* Task name - editable with right padding for close button */}
              <EditableTitle
                value={currentTask.name}
                onChange={handleTitleChange}
                className="text-2xl font-medium mb-6 pr-12"
                placeholder="Task name"
              />
              
              {/* Description section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </h3>
                {!showDescriptionEditor ? (
                  <div 
                    className="text-base leading-relaxed whitespace-pre-wrap cursor-pointer hover:text-muted-foreground transition-colors min-h-[24px]"
                    onClick={() => setShowDescriptionEditor(true)}
                  >
                    <LinkifiedText text={currentTask.description || "No description. Click to add one."} />
                  </div>
                ) : (
                  <TaskDescriptionEditor
                    ref={descriptionEditorRef}
                    description={currentTask.description}
                    onSave={handleDescriptionSave}
                    onCancel={handleDescriptionCancel}
                    placeholder="Add a description..."
                    minimal
                  />
                )}
              </div>
              
              {/* Due date section */}
              <div className="mt-8 pt-6 border-t border-border/30 space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Due Date
                </h3>
                <div className="flex items-center gap-3">
                  <DueDatePicker
                    dueDate={currentTask.dueDate}
                    onDateChange={handleDueDateChange}
                  />
                  {currentTask.dueDate && (
                    <DueDateBadge dueDate={currentTask.dueDate} dueSoonDays={dueSoonDays} />
                  )}
                  {!currentTask.dueDate && (
                    <span className="text-sm text-muted-foreground">No due date set</span>
                  )}
                </div>

                {multiplierResult.total > 1 && (
                  <div className="mt-4 pt-4 border-t border-border/20">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Multiplier Preview
                    </h4>
                    <div className="space-y-1">
                      {multiplierResult.breakdown.map((item, i) => (
                        <div key={`${item.source}-${i}`} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <span>{item.source === 'due-date-self' ? '🎯' : '📋'}</span>
                            <span>{item.label}</span>
                          </span>
                          <span className="font-medium text-foreground/80">×{item.multiplier}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm pt-1 border-t border-border/20">
                        <span className="text-muted-foreground">Potential</span>
                        <span className="font-semibold text-multiplier">×{multiplierResult.total}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}

      {showMultiplierBadge && completionMultiplier && (
        <MultiplierBadge result={completionMultiplier} onDismiss={handleDismissMultiplierBadge} />
      )}
    </>
  )
} 