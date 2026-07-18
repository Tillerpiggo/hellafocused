"use client"

import { useEffect, useRef } from "react"
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
  const isOpen = useFocusStore(state => state.notepadOpen)
  const setNotepadOpen = useFocusStore(state => state.setNotepadOpen)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevOpenRef = useRef(isOpen)
  const hasNotes = notes.trim().length > 0

  useEffect(() => {
    return () => flushSessionNotesSync(sessionId)
  }, [flushSessionNotesSync, sessionId])

  // Focus the textarea only when the user opens the notepad here — an
  // already-open notepad following a session switch or reload must not
  // steal focus.
  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = isOpen
    if (!isOpen || wasOpen) return
    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
      textarea.scrollTop = textarea.scrollHeight
    }
  }, [isOpen])

  // Escape while writing blurs the note; without this, Escape in focus mode
  // would exit fullscreen mid-typing. A blurred notepad lets Escape through.
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (document.activeElement !== textareaRef.current) return
      event.stopPropagation()
      textareaRef.current?.blur()
    }
    document.addEventListener("keydown", handleEscape, true)
    return () => document.removeEventListener("keydown", handleEscape, true)
  }, [isOpen])

  const toggle = () => {
    if (isOpen) flushSessionNotesSync(sessionId)
    setNotepadOpen(!isOpen)
  }

  return (
    <>
      {isOpen && (
        <div
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
        type="button"
        aria-label="Toggle session notes"
        aria-expanded={isOpen}
        aria-controls={`session-notepad-${sessionId}`}
        onClick={toggle}
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
            <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-foreground/30" />
          )}
        </span>
      </button>
    </>
  )
}
