"use client"

import { useFocusStore } from "@/store/focus-store"
import { FocusSessionControls } from "./focus-session-controls"
import { FocusView } from "./focus-view"
import { SessionNotepad } from "./session-notepad"

export function DockedSessionView({
  sessionId,
  animateEntrance = true,
}: {
  sessionId: string
  animateEntrance?: boolean
}) {
  const currentFocusTask = useFocusStore(state => state.currentFocusTask)
  const setSessionView = useFocusStore(state => state.setSessionView)
  const zoomSessionOut = useFocusStore(state => state.zoomSessionOut)

  const enterSuperfocus = () => setSessionView(sessionId, "focus")

  return (
    <div
      className="relative min-h-[calc(100vh-3.5rem)]"
      data-focus-session-view="docked"
    >
      <FocusView
        presentation="docked"
        onExitFocus={() => zoomSessionOut(sessionId)}
        animateEntrance={animateEntrance}
      />
      {currentFocusTask ? (
        <FocusSessionControls
          sessionId={sessionId}
          onClick={enterSuperfocus}
          label="Superfocus"
          title={`Superfocus on ${currentFocusTask.name}`}
        />
      ) : (
        <SessionNotepad sessionId={sessionId} placement="corner" />
      )}
    </div>
  )
}
