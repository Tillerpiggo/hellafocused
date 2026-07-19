"use client"

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { NotebookPen } from "lucide-react"
import { useFocusStore } from "@/store/focus-store"
import { cn } from "@/lib/utils"

const DEFAULT_BOUNDS = { width: 352, height: 256, right: 24, bottom: 76 }
const MIN_SIZE = { width: 280, height: 160 }
const VIEWPORT_GUTTER = 24

type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"

const RESIZE_HANDLES: Array<{
  direction: ResizeDirection
  className: string
}> = [
  { direction: "n", className: "-top-1 left-3 right-3 h-2 cursor-ns-resize" },
  { direction: "ne", className: "-right-1 -top-1 h-4 w-4 cursor-nesw-resize" },
  { direction: "e", className: "-right-1 bottom-3 top-3 w-2 cursor-ew-resize" },
  { direction: "se", className: "-bottom-1 -right-1 h-4 w-4 cursor-nwse-resize" },
  { direction: "s", className: "-bottom-1 left-3 right-3 h-2 cursor-ns-resize" },
  { direction: "sw", className: "-bottom-1 -left-1 h-4 w-4 cursor-nesw-resize" },
  { direction: "w", className: "-left-1 bottom-3 top-3 w-2 cursor-ew-resize" },
  { direction: "nw", className: "-left-1 -top-1 h-4 w-4 cursor-nwse-resize" },
]

const RESIZE_CURSORS: Record<ResizeDirection, string> = {
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
  nw: "nwse-resize",
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, Math.min(minimum, maximum)), maximum)
}

function constrainToViewport(bounds: typeof DEFAULT_BOUNDS) {
  const right = clamp(
    bounds.right,
    VIEWPORT_GUTTER,
    window.innerWidth - VIEWPORT_GUTTER - MIN_SIZE.width,
  )
  const bottom = clamp(
    bounds.bottom,
    VIEWPORT_GUTTER,
    window.innerHeight - VIEWPORT_GUTTER - MIN_SIZE.height,
  )
  const maxWidth = window.innerWidth - right - VIEWPORT_GUTTER
  const maxHeight = window.innerHeight - bottom - VIEWPORT_GUTTER

  return {
    width: clamp(bounds.width, MIN_SIZE.width, maxWidth),
    height: clamp(bounds.height, MIN_SIZE.height, maxHeight),
    right,
    bottom,
  }
}

export function SessionNotepad({
  sessionId,
  placement = "corner",
}: {
  sessionId: string
  // "inline" participates in a shared control row; "corner" stands alone.
  placement?: "inline" | "corner"
}) {
  const notes = useFocusStore(state =>
    state.sessions.find(session => session.id === sessionId)?.notes ?? ""
  )
  const setSessionNotes = useFocusStore(state => state.setSessionNotes)
  const flushSessionNotesSync = useFocusStore(state => state.flushSessionNotesSync)
  const isOpen = useFocusStore(state => state.notepadOpen)
  const setNotepadOpen = useFocusStore(state => state.setNotepadOpen)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const resizeCleanupRef = useRef<(() => void) | null>(null)
  const prevOpenRef = useRef(isOpen)
  const [bounds, setBounds] = useState(DEFAULT_BOUNDS)

  useEffect(() => {
    return () => {
      resizeCleanupRef.current?.()
      flushSessionNotesSync(sessionId)
    }
  }, [flushSessionNotesSync, sessionId])

  useEffect(() => {
    const keepPanelInViewport = () => {
      setBounds(current => constrainToViewport(current))
    }

    window.addEventListener("resize", keepPanelInViewport)
    return () => window.removeEventListener("resize", keepPanelInViewport)
  }, [])

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

  const startResize = (
    direction: ResizeDirection,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    const panel = panelRef.current
    if (!panel) return

    resizeCleanupRef.current?.()

    const startX = event.clientX
    const startY = event.clientY
    const startBounds = panel.getBoundingClientRect()
    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect

    document.body.style.cursor = RESIZE_CURSORS[direction]
    document.body.style.userSelect = "none"

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      let left = startBounds.left
      let right = startBounds.right
      let top = startBounds.top
      let bottom = startBounds.bottom

      if (direction.includes("w")) {
        left = clamp(
          startBounds.left + deltaX,
          VIEWPORT_GUTTER,
          startBounds.right - MIN_SIZE.width,
        )
      }
      if (direction.includes("e")) {
        right = clamp(
          startBounds.right + deltaX,
          startBounds.left + MIN_SIZE.width,
          window.innerWidth - VIEWPORT_GUTTER,
        )
      }
      if (direction.includes("n")) {
        top = clamp(
          startBounds.top + deltaY,
          VIEWPORT_GUTTER,
          startBounds.bottom - MIN_SIZE.height,
        )
      }
      if (direction.includes("s")) {
        bottom = clamp(
          startBounds.bottom + deltaY,
          startBounds.top + MIN_SIZE.height,
          window.innerHeight - VIEWPORT_GUTTER,
        )
      }

      setBounds({
        width: right - left,
        height: bottom - top,
        right: window.innerWidth - right,
        bottom: window.innerHeight - bottom,
      })
    }

    const stopResize = () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopResize)
      window.removeEventListener("pointercancel", stopResize)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      resizeCleanupRef.current = null
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", stopResize)
    window.addEventListener("pointercancel", stopResize)
    resizeCleanupRef.current = stopResize
  }

  return (
    <>
      {isOpen && (
        <div
          ref={panelRef}
          id={`session-notepad-${sessionId}`}
          className="fixed z-[70] rounded-2xl glass-dropdown shadow-[0_16px_48px_-12px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={bounds}
        >
          {RESIZE_HANDLES.map(handle => (
            <div
              key={handle.direction}
              aria-hidden="true"
              onPointerDown={event => startResize(handle.direction, event)}
              className={`absolute z-10 touch-none ${handle.className}`}
            />
          ))}
          <textarea
            ref={textareaRef}
            aria-label="Session notes"
            value={notes}
            onChange={event => setSessionNotes(sessionId, event.target.value)}
            placeholder="Notes…"
            className="block h-full w-full resize-none rounded-2xl bg-transparent px-4 py-3.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
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
          "group z-[60] grid h-[2.65rem] w-[2.65rem] place-items-center rounded-full glass-dropdown outline-none transition-all duration-300 ease-out",
          "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-6px_hsl(var(--primary)/0.35),0_4px_12px_rgba(0,0,0,0.08)]",
          "focus-visible:ring-2 focus-visible:ring-primary/40 active:translate-y-0 active:scale-[0.97] active:duration-150",
          placement === "inline" ? "relative" : "fixed bottom-6 right-6",
          isOpen ? "text-primary" : "text-foreground/75 hover:text-primary"
        )}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-primary/0 transition-colors duration-300 group-hover:bg-primary/5" />
        <NotebookPen className="relative h-4 w-4" />
      </button>
    </>
  )
}
