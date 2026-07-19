import { create } from "zustand"
import { persist } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"
import type { ScrapData } from "@/lib/types"
import type { TaskPath } from "@/lib/task-path"
import { useAppStore } from "./app-store"
import { trackScrapCreated, trackScrapUpdated, trackScrapDeleted } from "@/lib/sync-bridge"

interface ScrapsState {
  // Persisted capture queue; scraps[0] is the next scrap to sort
  scraps: ScrapData[]

  // Transient UI state for the global capture panel
  capturePanelOpen: boolean

  addScrap: (name: string) => void
  updateScrapName: (scrapId: string, name: string) => void
  deleteScrap: (scrapId: string) => void
  // Local-only queue rotation; not synced, so skip order stays per-device
  skipScrap: (scrapId: string) => void
  // Turns a scrap into a real task under parentPath and removes it from the queue
  assignScrapToParent: (scrapId: string, parentPath: TaskPath) => void
  setCapturePanelOpen: (open: boolean) => void
}

export const useScrapsStore = create<ScrapsState>()(
  persist(
    (set, get) => ({
      scraps: [],
      capturePanelOpen: false,

      addScrap: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return

        const now = new Date().toISOString()
        const scrap: ScrapData = {
          id: uuidv4(),
          name: trimmed,
          createdAt: now,
          updatedAt: now,
        }

        set({ scraps: [...get().scraps, scrap] })
        trackScrapCreated(scrap)
      },

      updateScrapName: (scrapId, name) => {
        const trimmed = name.trim()
        if (!trimmed) return

        let updated: ScrapData | null = null
        set({
          scraps: get().scraps.map((scrap) => {
            if (scrap.id !== scrapId) return scrap
            updated = { ...scrap, name: trimmed, updatedAt: new Date().toISOString() }
            return updated
          }),
        })
        if (updated) trackScrapUpdated(updated)
      },

      deleteScrap: (scrapId) => {
        set({ scraps: get().scraps.filter((scrap) => scrap.id !== scrapId) })
        trackScrapDeleted(scrapId)
      },

      skipScrap: (scrapId) => {
        const scraps = get().scraps
        const index = scraps.findIndex((scrap) => scrap.id === scrapId)
        if (index === -1 || scraps.length < 2) return
        const rotated = [...scraps]
        const [skipped] = rotated.splice(index, 1)
        rotated.push(skipped)
        set({ scraps: rotated })
      },

      assignScrapToParent: (scrapId, parentPath) => {
        if (parentPath.length === 0) return
        const scrap = get().scraps.find((candidate) => candidate.id === scrapId)
        if (!scrap) return

        useAppStore.getState().addSubtaskToParent(parentPath, scrap.name)
        set({ scraps: get().scraps.filter((candidate) => candidate.id !== scrapId) })
        trackScrapDeleted(scrapId)
      },

      setCapturePanelOpen: (open) => set({ capturePanelOpen: open }),
    }),
    {
      name: "scraps",
      partialize: (state) => ({ scraps: state.scraps }),
    }
  )
)
