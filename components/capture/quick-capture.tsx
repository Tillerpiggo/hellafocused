"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Plus, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useScrapsStore } from "@/store/scraps-store"
import { cn } from "@/lib/utils"

interface QuickCaptureProps {
  // Jumps to the Sort tab; omitted on pages without tab navigation
  onOpenSort?: () => void
}

export function QuickCapture({ onOpenSort }: QuickCaptureProps) {
  const scraps = useScrapsStore((state) => state.scraps)
  const addScrap = useScrapsStore((state) => state.addScrap)
  const deleteScrap = useScrapsStore((state) => state.deleteScrap)
  const isOpen = useScrapsStore((state) => state.capturePanelOpen)
  const setOpen = useScrapsStore((state) => state.setCapturePanelOpen)

  const [value, setValue] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  // Close on click outside; the panel floats over whatever the user is doing,
  // so any interaction elsewhere should dismiss it without stealing the click.
  useEffect(() => {
    if (!isOpen) return
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [isOpen, setOpen])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!value.trim()) return
    addScrap(value)
    setValue("")
    // Newest scrap renders at the top of the list, right under the input
    listRef.current?.scrollTo({ top: 0 })
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
  }

  const newestFirst = [...scraps].reverse()

  return (
    <div ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Quick capture"
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen)}
        className={cn(
          "h-8 w-8 transition-colors",
          isOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Plus className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-45")} />
      </Button>

      {/* Portaled to <body> with a high z-index so it escapes the top bar's
          stacking context and stays above fullscreen overlays (e.g. the focus
          task-details overlay at z-50). */}
      {isOpen && createPortal(
        <div ref={panelRef} className="fixed right-4 top-[3.75rem] z-[110] w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl glass-dropdown shadow-[0_16px_48px_-12px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Jot something down…"
              aria-label="Capture a scrap"
              className="w-full bg-transparent px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </form>

          {newestFirst.length > 0 && (
            <div ref={listRef} className="max-h-64 overflow-y-auto border-t border-border/40 py-1">
              {newestFirst.map((scrap) => (
                <div
                  key={scrap.id}
                  className="group flex items-center gap-2 px-4 py-1.5 text-sm text-foreground/85"
                >
                  <span className="min-w-0 flex-1 truncate">{scrap.name}</span>
                  <button
                    type="button"
                    aria-label={`Delete "${scrap.name}"`}
                    onClick={() => deleteScrap(scrap.id)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {scraps.length > 0 && onOpenSort && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onOpenSort()
              }}
              className="flex w-full items-center justify-between border-t border-border/40 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <span>
                Sort {scraps.length} {scraps.length === 1 ? "scrap" : "scraps"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
