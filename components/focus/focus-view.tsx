"use client"
import { useAppStore } from "@/store/app-store"
import { useUIStore } from "@/store/ui-store"
import { useFocusStore } from "@/store/focus-store"
import { findTaskPath, getProjectId } from "@/lib/task-utils"
import { useEffect, useState, useCallback, useRef } from "react"
import { AddTasksView } from "./add-tasks-view"
import { AllTasksCompletedView } from "./all-tasks-completed-view"
import { NoTasksAvailableView } from "./no-tasks-available-view"
import { FocusTaskView } from "./focus-task-view"
import { FocusHeaderButtons } from "./focus-header-buttons"
import { useTimerTick } from "@/hooks/use-timer-tick"

export function FocusView() {
  const projects = useAppStore((state) => state.projects)
  const toggleTaskDefer = useAppStore((state) => state.toggleTaskDefer)
  const toggleTaskPrefer = useAppStore((state) => state.toggleTaskPrefer)
  const setFocusMode = useUIStore((state) => state.setFocusMode)

  const {
    currentFocusTask,
    showAddTasksView,
    showSubtaskCelebration,
    focusModeProjectLeaves,
    focusStartPath: startPath,
    lastFocusedTaskId,
    activeSessionId,
    sessions,
    initializeFocus,
    resetFocus,
    completeFocusTask,
    getNextFocusTask,
    setShowAddTasksView,
    saveCurrentSessionState,
  } = useFocusStore((state) => state)

  const setTimer = useFocusStore(s => s.setTimer)
  const clearTimer = useFocusStore(s => s.clearTimer)
  const timerFired = useFocusStore(s => {
    const session = s.sessions.find(ss => ss.id === s.activeSessionId)
    return session?.timerFired ?? false
  })
  const timerEndTime = useFocusStore(s => {
    const session = s.sessions.find(ss => ss.id === s.activeSessionId)
    return session?.timerEndTime ?? null
  })
  const hasActiveTimer = !!timerEndTime
  const timerDisplay = useTimerTick(activeSessionId)

  const handleSetTimer = useCallback((durationMs: number) => {
    if (activeSessionId) setTimer(activeSessionId, durationMs)
  }, [activeSessionId, setTimer])

  const handleClearTimer = useCallback(() => {
    if (activeSessionId) clearTimer(activeSessionId)
  }, [activeSessionId, clearTimer])

  const clearTimerFired = useFocusStore(s => s.clearTimerFired)
  const handleAcknowledgeTimer = useCallback(() => {
    if (activeSessionId) clearTimerFired(activeSessionId)
  }, [activeSessionId, clearTimerFired])

  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [currentTaskPriority, setCurrentTaskPriority] = useState(0)
  const [showInfoOverlay, setShowInfoOverlay] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleExitFocusMode = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      useFocusStore.setState({ showSubtaskCelebration: false })
      saveCurrentSessionState()
      resetFocus()
      setFocusMode(false)
    }, 500)
  }, [resetFocus, setFocusMode, saveCurrentSessionState])

  const handleToggleDefer = useCallback((autoAdvance = true) => {
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
        
        if (autoAdvance) {
          // Automatically pick the next task after deferring
          getNextFocusTask()
        } else {
          // Update priority in-place to avoid animation
          const updatedProjects = useAppStore.getState().projects
          useFocusStore.getState().updateFocusLeaves(updatedProjects)
          
          const focusLeaves = useFocusStore.getState().focusModeProjectLeaves
          const currentTaskInLeaves = focusLeaves.find(t => t.id === currentFocusTask.id)
          if (currentTaskInLeaves) {
            // Update priority through store to avoid readonly property error
            useFocusStore.setState({ 
              currentFocusTask: { ...currentFocusTask, priority: currentTaskInLeaves.priority } 
            })
            // Update separate priority state for header buttons
            setCurrentTaskPriority(currentTaskInLeaves.priority)
          }
        }
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
          // Update priority through store to avoid readonly property error
          useFocusStore.setState({ 
            currentFocusTask: { ...currentFocusTask, priority: currentTaskInLeaves.priority } 
          })
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
      handleToggleDefer(true) // Auto-advance when using dropdown
    } else {
      // Normal - either unprefer or undefer
      if (currentFocusTask?.priority === 1) {
        handleTogglePrefer()
      } else if (currentFocusTask?.priority === -1) {
        handleToggleDefer(true) // Auto-advance when using dropdown
      }
    }
  }, [currentFocusTask?.priority, handleTogglePrefer, handleToggleDefer])

  // Track whether this is a session switch (not initial mount)
  const prevSessionId = useRef(activeSessionId)

  // Initialize focus when active session changes
  useEffect(() => {
    if (!activeSessionId) return
    const activeSession = sessions.find(s => s.id === activeSessionId)
    if (!activeSession) return

    // If session switched, reinitialize from session's startPath
    if (prevSessionId.current !== activeSessionId) {
      prevSessionId.current = activeSessionId
      initializeFocus(projects, activeSession.startPath)
    } else {
      // Initial mount — initialize from current startPath
      initializeFocus(projects, activeSession.startPath)
    }
  }, [activeSessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle initial load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  // Handle Escape key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showInfoOverlay) {
        // Only exit focus mode if overlay is not open
        handleExitFocusMode()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleExitFocusMode, showInfoOverlay])

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
          getNextFocusTask={() => {
            setIsTransitioning(true)
            getNextFocusTask()
            setTimeout(() => setIsTransitioning(false), 500)
          }}
          onToggleDefer={handleToggleDefer}
          onTogglePrefer={handleTogglePrefer}
          showInfoOverlay={showInfoOverlay}
          onShowInfoOverlay={setShowInfoOverlay}
          startPath={startPath}
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
          currentTaskPriority={showSubtaskCelebration ? 0 : currentTaskPriority}
          onPriorityChange={handleSetPriority}
          onShowTaskDetails={currentFocusTask ? () => setShowInfoOverlay(true) : undefined}
          hasDescription={!!currentFocusTask?.description}
          isTransitioning={isTransitioning}
          timerDisplay={timerDisplay}
          timerFired={timerFired}
          hasActiveTimer={hasActiveTimer}
          timerEndTime={timerEndTime}
          onSetTimer={handleSetTimer}
          onClearTimer={handleClearTimer}
          onAcknowledgeTimer={handleAcknowledgeTimer}
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
