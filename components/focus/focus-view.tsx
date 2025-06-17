"use client"
import { useAppStore } from "@/store/app-store"
import { useEffect, useState } from "react"
import { AddTasksView } from "./add-tasks-view"
import { AllTasksCompletedView } from "./all-tasks-completed-view"
import { NoTasksAvailableView } from "./no-tasks-available-view"
import { FocusTaskView } from "./focus-task-view"
import { FocusHeaderButtons } from "./focus-header-buttons"

export function FocusView() {
  const currentFocusTask = useAppStore((state) => state.currentFocusTask)
  const focusModeProjectLeaves = useAppStore((state) => state.focusModeProjectLeaves)
  const showAddTasksView = useAppStore((state) => state.showAddTasksView)
  const completeFocusTask = useAppStore((state) => state.completeFocusTask)
  const getNextFocusTask = useAppStore((state) => state.getNextFocusTask)
  const exitFocusMode = useAppStore((state) => state.exitFocusMode)
  const keepGoingFocus = useAppStore((state) => state.keepGoingFocus)
  const setShowAddTasksView = useAppStore((state) => state.setShowAddTasksView)

  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

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
