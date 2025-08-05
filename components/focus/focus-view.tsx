"use client"
import { useAppStore } from "@/store/app-store"
import { useUIStore } from "@/store/ui-store"
import { useFocusStore } from "@/store/focus-store"
import { findTaskPath, getProjectId } from "@/lib/task-utils"
import { useEffect, useState, useCallback } from "react"
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
  const toggleTaskDefer = useAppStore((state) => state.toggleTaskDefer)
  const toggleTaskPrefer = useAppStore((state) => state.toggleTaskPrefer)
  const setFocusMode = useUIStore((state) => state.setFocusMode)

  // Focus store for focus-specific state
  const {
    currentFocusTask,
    showAddTasksView,
    showSubtaskCelebration,
    focusModeProjectLeaves,
    lastFocusedTaskId,
    initializeFocus,
    resetFocus,
    completeFocusTask,
    getNextFocusTask,
    setShowAddTasksView
  } = useFocusStore((state) => state)

  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [currentTaskPriority, setCurrentTaskPriority] = useState(0)

  const handleExitFocusMode = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      // Clear celebration state when exiting focus mode
      useFocusStore.setState({ showSubtaskCelebration: false })
      resetFocus()
      setFocusMode(false)
    }, 500) // Increased from 300ms to 500ms for gentler exit
  }, [resetFocus, setFocusMode])

  const handleToggleDefer = useCallback(() => {
    if (!currentFocusTask) return
    
    const currentProjectId = getProjectId(startPath)
    if (!currentProjectId) return

    const projects = useAppStore.getState().projects
    const project = projects.find((p) => p.id === currentProjectId)
    if (project) {
      const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
      if (taskPathInProject) {
        const fullTaskPath = [currentProjectId, ...taskPathInProject]
        toggleTaskDefer(fullTaskPath)
        
        // Automatically pick the next task after deferring
        getNextFocusTask()
      }
    }
  }, [currentFocusTask, startPath, toggleTaskDefer, getNextFocusTask])

  const handleTogglePrefer = useCallback(() => {
    if (!currentFocusTask) return
    
    const currentProjectId = getProjectId(startPath)
    if (!currentProjectId) return

    const projects = useAppStore.getState().projects
    const project = projects.find((p) => p.id === currentProjectId)
    if (project) {
      const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
      if (taskPathInProject) {
        const fullTaskPath = [currentProjectId, ...taskPathInProject]
        toggleTaskPrefer(fullTaskPath)
        
        // Update priority in-place to avoid animation
        const updatedProjects = useAppStore.getState().projects
        useFocusStore.getState().updateFocusLeaves(updatedProjects)
        
        const focusLeaves = useFocusStore.getState().focusModeProjectLeaves
        const currentTaskInLeaves = focusLeaves.find(t => t.id === currentFocusTask.id)
        if (currentTaskInLeaves) {
          // Update priority in-place without changing object reference
          currentFocusTask.priority = currentTaskInLeaves.priority
          // Update separate priority state for header buttons
          setCurrentTaskPriority(currentTaskInLeaves.priority)
        }
      }
    }
  }, [currentFocusTask, startPath, toggleTaskPrefer])

  const handleSetPriority = useCallback((targetPriority: number) => {
    if (targetPriority === 1) {
      handleTogglePrefer()
    } else if (targetPriority === -1) {
      handleToggleDefer()
    } else {
      // Normal - either unprefer or undefer
      if (currentFocusTask?.priority === 1) {
        handleTogglePrefer()
      } else if (currentFocusTask?.priority === -1) {
        handleToggleDefer()
      }
    }
  }, [currentFocusTask?.priority, handleTogglePrefer, handleToggleDefer])

  // Initialize focus store when component mounts
  useEffect(() => {
    initializeFocus(projects, startPath)

    // Cleanup when component unmounts
    return () => {
      resetFocus()
    }
  }, [initializeFocus, resetFocus, startPath]) // eslint-disable-line react-hooks/exhaustive-deps
  // Note: projects intentionally excluded to prevent re-initialization when tasks are added

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
  }, [handleExitFocusMode])

  // Auto-select initial task if none is set
  useEffect(() => {
    if (!currentFocusTask && !showSubtaskCelebration) {
      // Try to restore last focused task if it's still valid
      const lastTask = lastFocusedTaskId 
        ? focusModeProjectLeaves.find(task => 
            task.id === lastFocusedTaskId && !task.completed
          )
        : null
        
      if (lastTask) {
        // Restore last task
        useFocusStore.setState({ currentFocusTask: lastTask })
      } else {
        // Fall back to priority selection
        getNextFocusTask()
      }
    }
  }, [currentFocusTask, showSubtaskCelebration, lastFocusedTaskId, focusModeProjectLeaves, getNextFocusTask])

  // Sync priority state when current task changes
  useEffect(() => {
    setCurrentTaskPriority(currentFocusTask?.priority ?? 0)
  }, [currentFocusTask?.priority])

  // Determine the main content based on current state
  const renderMainContent = () => {
    // Show subtask celebration if flagged
    if (showSubtaskCelebration) {
      return <AllTasksCompletedView onKeepGoing={() => useFocusStore.setState({ showSubtaskCelebration: false })} />
    }

    if (!currentFocusTask) {
      return <NoTasksAvailableView />
    } else {
      return (
        <FocusTaskView
          currentTask={currentFocusTask}
          completeFocusTask={completeFocusTask}
          getNextFocusTask={getNextFocusTask}
          onToggleDefer={handleToggleDefer}
          onTogglePrefer={handleTogglePrefer}
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
          currentTaskPriority={currentTaskPriority}
          onPriorityChange={handleSetPriority}
        />

        {/* Conditional main content */}
        {renderMainContent()}
      </div>

      {/* Add Tasks View */}
      <AddTasksView isVisible={showAddTasksView} onClose={() => {
        console.log('📞 FocusView onClose callback called - calling setShowAddTasksView(false)')
        setShowAddTasksView(false)
      }} />
    </>
  )
}
