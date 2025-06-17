"use client"
import { useAppStore } from "@/store/app-store"
import { useEffect, useState } from "react"
import { AddTasksView } from "./add-tasks-view"
import { AllTasksCompletedView } from "./all-tasks-completed-view"
import { NoTasksAvailableView } from "./no-tasks-available-view"
import { FocusTaskView } from "./focus-task-view"
import { FocusHeaderButtons } from "./focus-header-buttons"
import { triggerConfetti } from "@/lib/confetti"

export function FocusView() {
  const currentFocusTask = useAppStore((state) => state.currentFocusTask)
  const focusModeProjectLeaves = useAppStore((state) => state.focusModeProjectLeaves)
  const showAddTasksView = useAppStore((state) => state.showAddTasksView)
  const completeFocusTask = useAppStore((state) => state.completeFocusTask)
  const getNextFocusTask = useAppStore((state) => state.getNextFocusTask)
  const exitFocusMode = useAppStore((state) => state.exitFocusMode)
  const keepGoingFocus = useAppStore((state) => state.keepGoingFocus)
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

  // Dismiss focus view on esc
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

  // Determine the main content based on current state
  const renderMainContent = () => {
    if (!currentFocusTask) {
      const allTasksInProjectCompleted = focusModeProjectLeaves.every((t) => t.completed)
      if (allTasksInProjectCompleted && focusModeProjectLeaves.length > 0) {
        return <AllTasksCompletedView onKeepGoing={keepGoingFocus} />
      } else {
        return <NoTasksAvailableView />
      }
    } else {
      return (
        <FocusTaskView
          taskName={currentFocusTask.name}
          displayedTaskName={displayedTaskName}
          taskKey={taskKey}
          isTransitioning={isTransitioning}
          isCompleting={isCompleting}
          onCompleteTask={handleCompleteTask}
          onGetNextTask={handleGetNextTask}
        />
      )
    }
  }

  return (
    <>
      <div
        className={`min-h-screen flex flex-col ${currentFocusTask ? 'relative' : ''} transition-all duration-500 ease-out ${
          isInitialLoad ? "opacity-0 scale-95" : isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{ zIndex: isExiting ? 40 : 50 }}
      >
        <FocusHeaderButtons
          onExitFocus={handleExitFocusMode}
          onShowAddTasks={() => setShowAddTasksView(true)}
        />

        {/* Conditional main content */}
        {renderMainContent()}
      </div>

      {/* Add Tasks View */}
      <AddTasksView isVisible={showAddTasksView} onClose={() => setShowAddTasksView(false)} />
    </>
  )
}
