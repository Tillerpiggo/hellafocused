"use client"
import { useAppStore } from "@/store/app-store"
import { useUIStore } from "@/store/ui-store"
import { useFocusStore } from "@/store/focus-store"
import { useEffect, useState } from "react"
import { AddTasksView } from "./add-tasks-view"
import { AllTasksCompletedView } from "./all-tasks-completed-view"
import { NoTasksAvailableView } from "./no-tasks-available-view"
import { FocusTaskView } from "./focus-task-view"
import { FocusHeaderButtons } from "./focus-header-buttons"

interface FocusViewProps {
  startPath: string[]
}

export function FocusView({ startPath }: FocusViewProps) {
  // App store for projects data and app state updates
  const projects = useAppStore((state) => state.projects)
  const setFocusMode = useUIStore((state) => state.setFocusMode)

  // Focus store for focus-specific state
  const {
    currentFocusTask,
    focusModeProjectLeaves,
    showAddTasksView,
    initializeFocus,
    resetFocus,
    completeFocusTask,
    getNextFocusTask,
    keepGoingFocus,
    setShowAddTasksView
  } = useFocusStore((state) => state)

  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  // Initialize focus store when component mounts
  useEffect(() => {
    initializeFocus(projects, startPath)

    // Cleanup when component unmounts
    return () => {
      resetFocus()
    }
  }, [])

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

  const handleExitFocusMode = () => {
    setIsExiting(true)
    setTimeout(() => {
      resetFocus()
      setFocusMode(false)
    }, 500) // Increased from 300ms to 500ms for gentler exit
  }

  // Determine the main content based on current state
  const renderMainContent = () => {
    if (!currentFocusTask) {
      const allTasksInProjectCompleted = focusModeProjectLeaves.every((t) => t.completed)
      if (allTasksInProjectCompleted && focusModeProjectLeaves.length > 0) {
        return <AllTasksCompletedView onKeepGoing={() => keepGoingFocus(projects)} />
      } else {
        return <NoTasksAvailableView />
      }
    } else {
      return (
        <FocusTaskView
          currentTask={currentFocusTask}
          completeFocusTask={completeFocusTask}
          getNextFocusTask={getNextFocusTask}
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
