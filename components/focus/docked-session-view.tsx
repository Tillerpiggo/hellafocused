"use client"

import { useCallback, useEffect, useState } from "react"
import { TaskItem } from "@/components/task/task-item"
import { TasksView } from "@/components/tabs/tasks-view"
import { useAppStore } from "@/store/app-store"
import { getSessionAnchorTask, useFocusStore } from "@/store/focus-store"
import { FocusButton } from "./focus-button"
import { NoTasksAvailableView } from "./no-tasks-available-view"
import { SessionNotepad } from "./session-notepad"

export function DockedSessionView({ sessionId }: { sessionId: string }) {
  const projects = useAppStore(state => state.projects)
  const currentFocusTaskId = useFocusStore(state =>
    state.sessions.find(session => session.id === sessionId)?.currentFocusTaskId
  )
  const setSessionView = useFocusStore(state => state.setSessionView)
  const zoomSessionOut = useFocusStore(state => state.zoomSessionOut)
  const anchor = getSessionAnchorTask(useFocusStore.getState(), projects, sessionId)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  const exitToBrowse = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => zoomSessionOut(sessionId), 500)
  }, [isExiting, sessionId, zoomSessionOut])

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 150)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return
      exitToBrowse()
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [exitToBrowse])

  const continueFocus = () => setSessionView(sessionId, "focus")

  return (
    <div
      className={`flex min-h-[calc(100vh-3.5rem)] flex-col transition-all duration-500 ease-out ${
        isInitialLoad || isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
      data-focus-session-view="docked"
    >
      {anchor ? (
        <TasksView>
          <TaskItem
            key={currentFocusTaskId}
            task={anchor.task}
            currentPath={anchor.fullPath.slice(0, -1)}
            isFocusAnchor
            onFocusAnchor={continueFocus}
            onCreateFocusSession={() => continueFocus()}
          />
        </TasksView>
      ) : (
        <NoTasksAvailableView />
      )}
      {anchor && (
        <FocusButton
          onClick={continueFocus}
          label="Continue"
          title={`Continue ${anchor.task.name}`}
        />
      )}
      <SessionNotepad sessionId={sessionId} placement={anchor ? "beside-focus" : "corner"} />
    </div>
  )
}
