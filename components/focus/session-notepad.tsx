"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { NotebookPen } from "lucide-react"
import { useFocusStore } from "@/store/focus-store"
import { cn } from "@/lib/utils"

export function SessionNotepad({
  sessionId,
  placement = "beside-focus",
}: {
  sessionId: string
  // "beside-focus" sits left of the Focus pill in the session browser;
  // "corner" takes the bottom-right corner in fullscreen focus mode.
  placement?: "beside-focus" | "corner"
}) {
  const notes = useFocusStore(state =>
    state.sessions.find(session => session.id === sessionId)?.notes ?? ""
  )
  const setSessionNotes = useFocusStore(state => state.setSessionNotes)
  const flushSessionNotesSync = useFocusStore(state => state.flushSessionNotesSync)
  const [isOpen, setIsOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasNotes = notes.trim().length > 0

  const close = useCallback(() => {
    setIsOpen(false)
    flushSessionNotesSync(sessionId)
  }, [flushSessionNotesSync, sessionId])

  useEffect(() => {
    return () => flushSessionNotesSync(sessionId)
  }, [flushSessionNotesSync, sessionId])

  useEffect(() => {
    if (!isOpen) return

    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
      textarea.scrollTop = textarea.scrollHeight
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!cardRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        close()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.stopPropagation()
      close()
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape, true)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape, true)
    }
  }, [close, isOpen])

  return (
    <>
      {isOpen && (
        <div
          ref={cardRef}
          id={`session-notepad-${sessionId}`}
          className="fixed bottom-[4.75rem] right-6 z-40 w-[22rem] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl glass-dropdown shadow-[0_16px_48px_-12px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <textarea
            ref={textareaRef}
            aria-label="Session notes"
            value={notes}
            onChange={event => setSessionNotes(sessionId, event.target.value)}
            placeholder="Notes…"
            className="block h-64 w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        aria-label="Toggle session notes"
        aria-expanded={isOpen}
        aria-controls={`session-notepad-${sessionId}`}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        className={cn(
          "group fixed bottom-6 z-40 grid h-[2.65rem] w-[2.65rem] place-items-center rounded-full glass-dropdown outline-none transition-all duration-300 ease-out",
          "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-6px_hsl(var(--primary)/0.35),0_4px_12px_rgba(0,0,0,0.08)]",
          "focus-visible:ring-2 focus-visible:ring-primary/40 active:translate-y-0 active:scale-[0.97] active:duration-150",
          placement === "beside-focus" ? "right-[8.5rem]" : "right-6",
          isOpen ? "text-primary" : "text-foreground/75 hover:text-primary"
        )}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-primary/0 transition-colors duration-300 group-hover:bg-primary/5" />
        <span className="relative">
          <NotebookPen className="h-4 w-4" />
          {hasNotes && !isOpen && (
            <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-primary/90" />
          )}
        </span>
      </button>
    </>
  )
}
