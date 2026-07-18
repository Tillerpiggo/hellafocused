"use client"

import { useEffect } from "react"
import { FocusView } from "./focus-view"
import { SessionBrowser } from "./session-browser"
import { useAppStore } from "@/store/app-store"
import { useFocusStore } from "@/store/focus-store"

export function FocusSessionWorkspace({
  sessionId,
}: {
  sessionId: string
}) {
  const projects = useAppStore(state => state.projects)
  const session = useFocusStore(state => state.sessions.find(item => item.id === sessionId))
  const activeSessionId = useFocusStore(state => state.activeSessionId)
  const switchSession = useFocusStore(state => state.switchSession)
  const setSessionView = useFocusStore(state => state.setSessionView)

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
      <SessionBrowser sessionId={sessionId} />
      {session.view === 'focus' && (
        <div className="fixed inset-0 z-[100] bg-background text-foreground">
          <FocusView onExitFocus={() => setSessionView(sessionId, 'browse')} />
        </div>
      )}
    </div>
  )
}
