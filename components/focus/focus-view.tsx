"use client"
import { useAppStore } from "@/store/app-store"
import { useFocusStore } from "@/store/focus-store"
import { useEffect, useState, useCallback } from "react"
import { AddTasksView } from "./add-tasks-view"
import { AllTasksCompletedView } from "./all-tasks-completed-view"
import { NoTasksAvailableView } from "./no-tasks-available-view"
import { FocusTaskView } from "./focus-task-view"
import { FocusHeaderButtons } from "./focus-header-buttons"
import { PendingBanner } from "./pending-banner"
import { SessionNotepad } from "./session-notepad"

export function FocusView({
  onExitFocus,
  presentation = "fullscreen",
  animateEntrance = true,
}: {
  onExitFocus?: () => void
  presentation?: "fullscreen" | "docked"
  animateEntrance?: boolean
}) {
  const projects = useAppStore((state) => state.projects)
  const toggleTaskDefer = useAppStore((state) => state.toggleTaskDefer)
  const toggleTaskPrefer = useAppStore((state) => state.toggleTaskPrefer)

  const currentFocusTask = useFocusStore(state => state.currentFocusTask)
  const currentFocusTaskPath = useFocusStore(state => state.currentFocusTaskPath)
  const showAddTasksView = useFocusStore(state => state.showAddTasksView)
  const showSubtaskCelebration = useFocusStore(state => state.showSubtaskCelebration)
  const focusModeProjectLeaves = useFocusStore(state => state.focusModeProjectLeaves)
  const lastFocusedTaskId = useFocusStore(state => state.lastFocusedTaskId)
  const activeSessionId = useFocusStore(state => state.activeSessionId)
  const sessions = useFocusStore(state => state.sessions)
  const initializeFocus = useFocusStore(state => state.initializeFocus)
  const completeFocusTask = useFocusStore(state => state.completeFocusTask)
  const getNextFocusTask = useFocusStore(state => state.getNextFocusTask)
  const setCurrentFocusTask = useFocusStore(state => state.setCurrentFocusTask)
  const setShowAddTasksView = useFocusStore(state => state.setShowAddTasksView)
  const setShowSubtaskCelebration = useFocusStore(state => state.setShowSubtaskCelebration)
  const refreshFocusLeaves = useFocusStore(state => state.refreshFocusLeaves)
  const saveCurrentSessionState = useFocusStore(state => state.saveCurrentSessionState)
  const markPending = useFocusStore(s => s.markPending)
  const resolvePending = useFocusStore(s => s.resolvePending)
  const isPending = useFocusStore(s => {
    const session = s.sessions.find(ss => ss.id === s.activeSessionId)
    return session?.pending ?? false
  })

  const handleMarkPending = useCallback((remindInMs: number | null) => {
    if (activeSessionId) markPending(activeSessionId, remindInMs)
  }, [activeSessionId, markPending])

  const handleResolvePending = useCallback(() => {
    if (activeSessionId) resolvePending(activeSessionId)
  }, [activeSessionId, resolvePending])

  const [isInitialLoad, setIsInitialLoad] = useState(animateEntrance)
  const [isExiting, setIsExiting] = useState(false)
  const [currentTaskPriority, setCurrentTaskPriority] = useState(0)
  const [showInfoOverlay, setShowInfoOverlay] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleExitFocusMode = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      setShowSubtaskCelebration(false)
      saveCurrentSessionState()
      onExitFocus?.()
    }, 500)
  }, [onExitFocus, saveCurrentSessionState, setShowSubtaskCelebration])

  const handleToggleDefer = useCallback((autoAdvance = true) => {
    if (!currentFocusTask || !currentFocusTaskPath) return

    toggleTaskDefer(currentFocusTaskPath)
        
    if (autoAdvance) {
      // Automatically pick the next task after deferring
      getNextFocusTask()
    } else {
      // Update priority in-place to avoid animation
      const refreshedTask = refreshFocusLeaves()
      if (refreshedTask) setCurrentTaskPriority(refreshedTask.priority)
    }
  }, [currentFocusTask, currentFocusTaskPath, toggleTaskDefer, getNextFocusTask, refreshFocusLeaves])

  const handleTogglePrefer = useCallback(() => {
    if (!currentFocusTask || !currentFocusTaskPath) return

    toggleTaskPrefer(currentFocusTaskPath)
        
    // Update priority in-place to avoid animation
    const refreshedTask = refreshFocusLeaves()
    if (refreshedTask) setCurrentTaskPriority(refreshedTask.priority)
  }, [currentFocusTask, currentFocusTaskPath, toggleTaskPrefer, refreshFocusLeaves])

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

  const activeSession = sessions.find(session => session.id === activeSessionId)
  const activeScopeKey = activeSession?.startPath.join('/') ?? ''
  const activeSessionTaskId = activeSession?.currentFocusTaskId
  const hasActiveSession = activeSession !== undefined

  // Rebuild the task pool when this session or its synced scope changes.
  useEffect(() => {
    if (!activeSession) return
    initializeFocus(projects, activeSession.startPath)
  }, [activeSessionId, activeScopeKey, initializeFocus, projects]) // eslint-disable-line react-hooks/exhaustive-deps

  // A Next action on another device updates the active task without changing tabs.
  useEffect(() => {
    const syncedTaskId = activeSession?.currentFocusTaskId
    if (!syncedTaskId || currentFocusTask?.id === syncedTaskId) return
    const syncedTask = focusModeProjectLeaves.find(task => task.id === syncedTaskId && !task.completed)
    if (syncedTask) setCurrentFocusTask(syncedTask)
  }, [activeSession?.currentFocusTaskId, currentFocusTask?.id, focusModeProjectLeaves, setCurrentFocusTask])

  // Handle initial load animation
  useEffect(() => {
    if (!animateEntrance) {
      setIsInitialLoad(false)
      return
    }

    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [animateEntrance])

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
    if (currentFocusTask || showSubtaskCelebration) return

    // On hydration the persisted session is ready one render before its
    // transient task pool. Do not save a null/random task during that gap.
    if (focusModeProjectLeaves.length === 0) return

    const restorableTaskId = hasActiveSession
      ? activeSessionTaskId ?? null
      : lastFocusedTaskId
    const restorableTask = restorableTaskId
      ? focusModeProjectLeaves.find(task => task.id === restorableTaskId && !task.completed)
      : null

    if (restorableTask) setCurrentFocusTask(restorableTask)
    else getNextFocusTask()
  }, [
    activeSessionTaskId,
    currentFocusTask,
    focusModeProjectLeaves,
    getNextFocusTask,
    hasActiveSession,
    lastFocusedTaskId,
    setCurrentFocusTask,
    showSubtaskCelebration,
  ])

  // Sync priority state when current task changes
  useEffect(() => {
    setCurrentTaskPriority(currentFocusTask?.priority ?? 0)
  }, [currentFocusTask?.priority])

  // Determine the main content based on current state
  const renderMainContent = () => {
    // Show subtask celebration if flagged
    if (showSubtaskCelebration) {
      return <AllTasksCompletedView onKeepGoing={() => setShowSubtaskCelebration(false)} />
    }

    if (!currentFocusTask) {
      return <NoTasksAvailableView />
    } else {
      return (
        <FocusTaskView
          key={activeSessionId ?? "focus-task"}
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
          animateInitialTask={presentation === "fullscreen" && animateEntrance}
        />
      )
    }
  }

  return (
    <>
      <div
        className={`${
          presentation === "fullscreen"
            ? `min-h-screen ${currentFocusTask ? "relative" : ""}`
            : "relative min-h-[calc(100vh-3.5rem)] overflow-hidden"
        } flex flex-col transition-all duration-500 ease-out ${
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
          isPending={isPending}
          onMarkPending={handleMarkPending}
          onResolvePending={handleResolvePending}
          exitLabel={presentation === "docked" ? "Browse session" : "Exit full screen"}
        />

        {activeSessionId && <PendingBanner sessionId={activeSessionId} />}

        {/* Conditional main content */}
        {renderMainContent()}
        {activeSessionId && presentation === "fullscreen" && (
          <SessionNotepad
            sessionId={activeSessionId}
            placement="corner"
          />
        )}
      </div>

      {/* Add Tasks View */}
      <AddTasksView isVisible={showAddTasksView} onClose={() => {
        console.log('📞 FocusView onClose callback called - calling setShowAddTasksView(false)')
        setShowAddTasksView(false)
      }} />
    </>
  )
}
