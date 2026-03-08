"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useAppStore } from "@/store/app-store"
import { useUIStore } from "@/store/ui-store"
import { useFocusStore } from "@/store/focus-store"
import { findTaskAtPath, findProjectAtPath, getProjectId } from "@/lib/task-utils"
import { Target, Layers, Plus, X, Timer } from "lucide-react"
import { useGlobalTimerCheck } from "@/hooks/use-global-timer-check"
import { useTimerTick } from "@/hooks/use-timer-tick"
import { formatRemainingFull } from "./timer-picker"

function useSessionName(startPath: string[]) {
  const projects = useAppStore(s => s.projects)
  const projectId = getProjectId(startPath)
  if (!projectId) return null

  const project = findProjectAtPath(projects, startPath)
  if (startPath.length === 1) {
    return project?.name || null
  }

  const task = findTaskAtPath(projects, startPath)
  return task?.name || null
}

function SessionCard({
  session,
  isActive,
  onClick,
  onRemove,
}: {
  session: { id: string; startPath: string[]; currentFocusTaskId: string | null; completedCount: number; createdAt: number; timerEndTime?: number | null; timerFired?: boolean }
  isActive: boolean
  onClick: () => void
  onRemove: () => void
}) {
  const name = useSessionName(session.startPath)
  const isUnavailable = name === null
  const timerDisplay = useTimerTick(session.timerEndTime ? session.id : null)
  const [isHovered, setIsHovered] = useState(false)
  const dockShortRef = useRef<HTMLSpanElement>(null)
  const dockFullRef = useRef<HTMLSpanElement>(null)
  const [dockLabelWidth, setDockLabelWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    const short = dockShortRef.current?.offsetWidth
    const full = dockFullRef.current?.offsetWidth
    setDockLabelWidth(isHovered && full ? full : short)
  }, [isHovered, timerDisplay?.label, session.timerEndTime])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group relative cursor-pointer ${
        isActive
          ? "bg-primary/15 border border-primary/30"
          : isUnavailable
            ? "opacity-50 border border-transparent"
            : "hover:bg-foreground/5 border border-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-medium truncate ${isUnavailable ? "text-muted-foreground italic" : ""}`}>
            {isUnavailable ? "Session unavailable" : name}
          </div>
          {!isUnavailable && (session.completedCount > 0 || timerDisplay) && (
            <div className="flex items-center gap-2 mt-0.5">
              {session.completedCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {session.completedCount} completed
                </span>
              )}
              {timerDisplay && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span
                    className="relative inline-block overflow-hidden align-middle tabular-nums transition-[width] duration-300 ease-in-out"
                    style={{ width: dockLabelWidth }}
                  >
                    <span
                      ref={dockShortRef}
                      className={`inline-block whitespace-nowrap transition-opacity duration-300 ease-in-out ${isHovered && session.timerEndTime ? "opacity-0" : "opacity-100"}`}
                    >
                      {timerDisplay.label}
                    </span>
                    {session.timerEndTime && (
                      <span
                        ref={dockFullRef}
                        className={`absolute left-0 top-0 whitespace-nowrap transition-opacity duration-300 ease-in-out ${isHovered ? "opacity-100" : "opacity-0"}`}
                      >
                        {formatRemainingFull(session.timerEndTime - Date.now())}
                      </span>
                    )}
                  </span>
                </span>
              )}
            </div>
          )}
          {!isUnavailable && session.timerFired && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
              <span className="text-xs text-primary font-medium">Timer done</span>
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="flex-shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-foreground/10 transition-all"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export function SessionDock() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)

  const projects = useAppStore(s => s.projects)
  const currentPath = useAppStore(s => s.currentPath)
  const isFocusMode = useUIStore(s => s.isFocusMode)
  const setFocusMode = useUIStore(s => s.setFocusMode)

  const sessions = useFocusStore(s => s.sessions)
  const activeSessionId = useFocusStore(s => s.activeSessionId)
  const createOrResumeSession = useFocusStore(s => s.createOrResumeSession)
  const switchSession = useFocusStore(s => s.switchSession)
  const removeSession = useFocusStore(s => s.removeSession)
  const saveCurrentSessionState = useFocusStore(s => s.saveCurrentSessionState)

  const anyFiredTimer = useFocusStore(s =>
    s.sessions.some(session => session.timerFired === true)
  )
  const anyInactiveFiredTimer = useFocusStore(s =>
    s.sessions.some(session => session.timerFired === true && session.id !== s.activeSessionId)
  )
  const showDockBadge = isFocusMode ? anyInactiveFiredTimer : anyFiredTimer

  useGlobalTimerCheck()

  const handleFocusClick = useCallback(() => {
    createOrResumeSession(projects, currentPath)
    setFocusMode(true, currentPath)
  }, [projects, currentPath, createOrResumeSession, setFocusMode])

  const handleSessionClick = useCallback((sessionId: string) => {
    if (sessionId === activeSessionId && isFocusMode) {
      setIsPopoverOpen(false)
      return
    }

    switchSession(sessionId, projects)
    if (!isFocusMode) {
      setFocusMode(true)
    }
    setIsPopoverOpen(false)
  }, [activeSessionId, isFocusMode, switchSession, projects, setFocusMode])

  const handleRemoveSession = useCallback((sessionId: string) => {
    const willRemoveLast = sessions.length === 1
    const isRemovingActive = sessionId === activeSessionId

    removeSession(sessionId)

    if (willRemoveLast && isFocusMode) {
      setFocusMode(false)
      setIsPopoverOpen(false)
    } else if (isRemovingActive && !willRemoveLast) {
      // switchSession is called internally by removeSession
    }
  }, [sessions.length, activeSessionId, removeSession, isFocusMode, setFocusMode])

  const handleAddClick = useCallback(() => {
    if (isFocusMode) {
      saveCurrentSessionState()
      setFocusMode(false)
      setIsPopoverOpen(false)
    } else {
      createOrResumeSession(projects, currentPath)
      setFocusMode(true, currentPath)
      setIsPopoverOpen(false)
    }
  }, [isFocusMode, saveCurrentSessionState, setFocusMode, createOrResumeSession, projects, currentPath])

  // Close popover on click outside
  useEffect(() => {
    if (!isPopoverOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        dockRef.current && !dockRef.current.contains(e.target as Node)
      ) {
        setIsPopoverOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        setIsPopoverOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape, true)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape, true)
    }
  }, [isPopoverOpen])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Popover */}
      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className="glass-dropdown rounded-xl shadow-lg w-64 max-h-80 overflow-y-auto p-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {sessions.length > 0 && (
            <div className="space-y-1">
              {sessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isActive={isFocusMode && session.id === activeSessionId}
                  onClick={() => handleSessionClick(session.id)}
                  onRemove={() => handleRemoveSession(session.id)}
                />
              ))}
            </div>
          )}

          <div className={sessions.length > 0 ? "mt-1 pt-1 border-t border-foreground/5" : ""}>
            <button
              onClick={handleAddClick}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add focus session
            </button>
          </div>
        </div>
      )}

      {/* Split-pill dock */}
      <div ref={dockRef} className="flex items-stretch glass-dropdown rounded-full overflow-hidden shadow-lg">
        {/* Focus button — hidden in focus mode */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            isFocusMode ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
          }`}
        >
          <button
            onClick={handleFocusClick}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors whitespace-nowrap"
          >
            <Target className="h-4 w-4" />
            Focus
          </button>
        </div>

        {/* Divider — hidden in focus mode */}
        {!isFocusMode && (
          <div className="w-px bg-foreground/10 my-2" />
        )}

        {/* Sessions button — always visible */}
        <button
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
            isPopoverOpen
              ? "text-primary"
              : "text-foreground hover:bg-foreground/5"
          }`}
        >
          <div className="relative">
            <Layers className="h-4 w-4" />
            {showDockBadge && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          {sessions.length > 0 && (
            <span className="text-xs text-muted-foreground">{sessions.length}</span>
          )}
        </button>
      </div>
    </div>
  )
}
