"use client"

import { useEffect, useRef } from "react"
import { FocusView } from "./focus-view"
import { PendingBanner } from "./pending-banner"
import { SessionBrowser } from "./session-browser"
import { DockedSessionView } from "./docked-session-view"
import { useAppStore } from "@/store/app-store"
import { useFocusStore } from "@/store/focus-store"
import { shouldAnimateFocusEntrance } from "@/lib/focus-session-transition"
import type { TaskPath } from "@/lib/task-path"

export function FocusSessionWorkspace({
  sessionId,
  onCreateFocusSession,
}: {
  sessionId: string
  onCreateFocusSession: (taskPath: TaskPath) => void
}) {
  const projects = useAppStore(state => state.projects)
  const session = useFocusStore(state => state.sessions.find(item => item.id === sessionId))
  const activeSessionId = useFocusStore(state => state.activeSessionId)
  const switchSession = useFocusStore(state => state.switchSession)
  const zoomSessionOut = useFocusStore(state => state.zoomSessionOut)
  const previousSessionId = useRef<string | null>(null)
  const animateEntrance = shouldAnimateFocusEntrance(previousSessionId.current, sessionId)

  useEffect(() => {
    // Keep the previous id through the render that activates the target session.
    // This also suppresses task-level entrance motion when its keyed view mounts.
    if (activeSessionId === sessionId) previousSessionId.current = sessionId
  }, [activeSessionId, sessionId])

  useEffect(() => {
    if (session && activeSessionId !== sessionId) switchSession(sessionId, projects)
  }, [activeSessionId, projects, session, sessionId, switchSession])

  if (!session) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center text-sm text-muted-foreground">
        This focus session is no longer available.
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      {session.view === 'browse' && (
        <>
          <SessionBrowser sessionId={sessionId} onCreateFocusSession={onCreateFocusSession} />
          <PendingBanner sessionId={sessionId} />
        </>
      )}
      {session.view === 'docked' && (
        <DockedSessionView
          sessionId={sessionId}
          animateEntrance={animateEntrance}
        />
      )}
      {session.view === 'focus' && (
        <div className="fixed inset-0 z-[100] bg-background text-foreground">
          <FocusView
            onExitFocus={() => zoomSessionOut(sessionId)}
            animateEntrance={animateEntrance}
          />
        </div>
      )}
    </div>
  )
}
