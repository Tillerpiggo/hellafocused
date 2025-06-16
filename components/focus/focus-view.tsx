"use client"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Check, Shuffle, PartyPopper, ArrowUp, X, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { AddTasksView } from "./add-tasks-view"
import { triggerConfetti } from "@/lib/confetti"

export function FocusView() {
  const currentFocusTask = useAppStore((state) => state.currentFocusTask)
  const completeFocusTask = useAppStore((state) => state.completeFocusTask)
  const getNextFocusTask = useAppStore((state) => state.getNextFocusTask)
  const exitFocusMode = useAppStore((state) => state.exitFocusMode)
  const focusModeProjectLeaves = useAppStore((state) => state.focusModeProjectLeaves)
  const keepGoingFocus = useAppStore((state) => state.keepGoingFocus)
  const showAddTasksView = useAppStore((state) => state.showAddTasksView)
  const setShowAddTasksView = useAppStore((state) => state.setShowAddTasksView)

  const [isTransitioning, setIsTransitioning] = useState(false)
  const [taskKey, setTaskKey] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [displayedTaskName, setDisplayedTaskName] = useState("")
  const [isExiting, setIsExiting] = useState(false)

  // Update displayed task name when current task changes (but not during completion)
  useEffect(() => {
    if (currentFocusTask && !isCompleting) {
      setDisplayedTaskName(currentFocusTask.name)
      setTaskKey((prev) => prev + 1)
    }
  }, [currentFocusTask, isCompleting])

  // Handle initial load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [])



  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleExitFocusMode()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])





  const handleCompleteTask = () => {
    if (isCompleting || !currentFocusTask) return

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
    }, 200)
  }

  const handleGetNextTask = () => {
    if (isCompleting) return

    setIsTransitioning(true)

    setTimeout(() => {
      getNextFocusTask()
      setIsTransitioning(false)
    }, 100)
  }

  const handleExitFocusMode = () => {
    setIsExiting(true)
    setTimeout(() => {
      exitFocusMode()
    }, 500) // Increased from 300ms to 500ms for gentler exit
  }

  if (!currentFocusTask) {
    const allTasksInProjectCompleted = focusModeProjectLeaves.every((t) => t.completed)
    if (allTasksInProjectCompleted && focusModeProjectLeaves.length > 0) {
      return (
        <>
          <div
            className={`min-h-screen flex flex-col transition-all duration-500 ease-out ${
              isInitialLoad ? "opacity-0 scale-95" : isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
            style={{ zIndex: isExiting ? 40 : 50 }}
          >
            {/* Exit button in top left */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 left-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
              onClick={handleExitFocusMode}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Exit focus mode</span>
            </Button>

            {/* Add tasks button in top right */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 right-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
              onClick={() => setShowAddTasksView(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">Add tasks</span>
            </Button>

            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
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
                onClick={keepGoingFocus}
              >
                <ArrowUp className="mr-2 h-5 w-5" />
                Continue Journey
              </Button>
            </div>
          </div>
          <AddTasksView isVisible={showAddTasksView} onClose={() => setShowAddTasksView(false)} />
        </>
      )
    }
    return (
      <>
        <div
          className={`min-h-screen flex flex-col transition-all duration-500 ease-out ${
            isInitialLoad ? "opacity-0 scale-95" : isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
          style={{ zIndex: isExiting ? 40 : 50 }}
        >
          {/* Exit button in top left */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 left-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
            onClick={handleExitFocusMode}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Exit focus mode</span>
          </Button>

          {/* Add tasks button in top right */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
            onClick={() => setShowAddTasksView(true)}
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Add tasks</span>
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 mb-8 rounded-full bg-muted/50 flex items-center justify-center">
              <div className="w-3 h-3 bg-muted-foreground/30 rounded-full"></div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light mb-4 text-muted-foreground">Peaceful moment</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed">
              No tasks await your attention right now. Rest in this quiet space.
            </p>
          </div>
        </div>
        <AddTasksView isVisible={showAddTasksView} onClose={() => setShowAddTasksView(false)} />
      </>
    )
  }

  return (
    <>
      <div
        className={`min-h-screen flex flex-col relative transition-all duration-500 ease-out ${
          isInitialLoad ? "opacity-0 scale-95" : isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{ zIndex: isExiting ? 40 : 50 }}
      >
        {/* Exit button in top left */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 left-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
          onClick={handleExitFocusMode}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Exit focus mode</span>
        </Button>

        {/* Add tasks button in top right */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
          onClick={() => setShowAddTasksView(true)}
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">Add tasks</span>
        </Button>

        {/* Main content area with task title - centered vertically and horizontally */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div className="relative max-w-4xl w-full">
            <h1
              key={taskKey}
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-foreground text-center leading-relaxed break-words transition-all duration-300 ease-out ${
                isTransitioning ? "animate-slide-up-out" : "animate-slide-up-in"
              }`}
            >
              {displayedTaskName || currentFocusTask.name}
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
      </div>

      {/* Add Tasks View */}
      <AddTasksView isVisible={showAddTasksView} onClose={() => setShowAddTasksView(false)} />

    </>
  )
}
