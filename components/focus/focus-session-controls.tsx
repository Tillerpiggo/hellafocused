"use client"

import { FocusButton } from "./focus-button"
import { SessionNotepad } from "./session-notepad"

export function FocusSessionControls({
  sessionId,
  onClick,
  label,
  title,
}: {
  sessionId: string
  onClick: () => void
  label: "Focus" | "Continue" | "Superfocus"
  title?: string
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5">
      <SessionNotepad sessionId={sessionId} placement="inline" />
      <FocusButton
        onClick={onClick}
        label={label}
        title={title}
        positioning="inline"
      />
    </div>
  )
}
