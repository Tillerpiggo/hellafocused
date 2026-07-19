"use client"

import { useFocusStore } from "@/store/focus-store"
import { FocusButton } from "./focus-button"
import { FocusView } from "./focus-view"

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
      {currentFocusTask && (
        <FocusButton
          onClick={enterSuperfocus}
          label="Superfocus"
          title={`Superfocus on ${currentFocusTask.name}`}
        />
      )}
    </div>
  )
}
