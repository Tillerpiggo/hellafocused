"use client"

import { useState } from "react"
import { Check, Plus, SkipForward, Trash2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditableTitle } from "@/components/editable-title"
import { ParentPicker } from "@/components/sort/parent-picker"
import { useScrapsStore } from "@/store/scraps-store"
import { useAppStore } from "@/store/app-store"
import { getPathDisplayName, isProjectList } from "@/lib/task-utils"
import type { TaskPath } from "@/lib/task-path"

interface SortViewProps {
  // Closes out the tab once sorting is done (the tab hides when the queue is
  // empty and it's no longer active)
  onDone?: () => void
}

// One-at-a-time triage: the oldest scrap is shown until it's filed into the
// hierarchy, skipped to the back of the queue, or deleted.
export function SortView({ onDone }: SortViewProps) {
  const scraps = useScrapsStore((state) => state.scraps)
  const updateScrapName = useScrapsStore((state) => state.updateScrapName)
  const deleteScrap = useScrapsStore((state) => state.deleteScrap)
  const skipScrap = useScrapsStore((state) => state.skipScrap)
  const assignScrapToParent = useScrapsStore((state) => state.assignScrapToParent)
  const setCapturePanelOpen = useScrapsStore((state) => state.setCapturePanelOpen)
  const projects = useAppStore((state) => state.projects)

  // Destination survives across scraps — consecutive captures often belong
  // near each other, so the picker stays where you last filed something.
  const [pickerPath, setPickerPath] = useState<TaskPath>([])

  const currentScrap = scraps[0]
  const canAddHere = !isProjectList(pickerPath)
  const destinationName = canAddHere ? getPathDisplayName(projects, pickerPath) : null

  if (!currentScrap) {
    return (
      <div className="container mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <Sparkles className="h-10 w-10 text-primary/40" />
        <h1 className="text-3xl font-light tracking-wide text-foreground">Nothing to sort</h1>
        <p className="max-w-sm text-muted-foreground">
          Jot thoughts down with the{" "}
          <button
            type="button"
            onClick={() => setCapturePanelOpen(true)}
            className="inline-flex translate-y-[3px] items-center rounded border border-border px-1 text-foreground/70 transition-colors hover:text-foreground"
            aria-label="Open quick capture"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>{" "}
          in the top bar — they&apos;ll wait here until you give them a home.
        </p>
        {onDone && (
          <Button variant="outline" onClick={onDone} className="mt-2">
            <Check className="mr-2 h-4 w-4" />
            Done sorting
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto flex h-full max-w-2xl flex-col px-6 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-3xl font-light tracking-wide text-foreground">Sort</h1>
        <span className="text-sm text-muted-foreground">
          {scraps.length} {scraps.length === 1 ? "scrap" : "scraps"} left
        </span>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-background/60 p-5">
        <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground/70">
          Where does this go?
        </div>
        <EditableTitle
          key={currentScrap.id}
          value={currentScrap.name}
          onChange={(newName) => updateScrapName(currentScrap.id, newName)}
          className="text-2xl font-light leading-snug"
          placeholder="Untitled scrap"
        />
      </div>

      <ParentPicker currentPath={pickerPath} onNavigate={setPickerPath} />

      <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
        <Button
          className="min-w-0 flex-1"
          disabled={!canAddHere}
          onClick={() => assignScrapToParent(currentScrap.id, pickerPath)}
        >
          <span className="truncate">
            {canAddHere ? `Add to "${destinationName}"` : "Choose a destination"}
          </span>
        </Button>
        <Button
          variant="outline"
          disabled={scraps.length < 2}
          onClick={() => skipScrap(currentScrap.id)}
        >
          <SkipForward className="mr-2 h-4 w-4" />
          Skip
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete scrap"
          onClick={() => deleteScrap(currentScrap.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
