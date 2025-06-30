import { create } from "zustand"
import { persist } from "zustand/middleware"
import { produce } from "immer"
import { v4 as uuidv4 } from "uuid"
import type { SyncAction } from "@/lib/sync-types"

interface SyncStore {
  // State
  pendingChanges: Record<string, SyncAction>
  lastSyncedAt: number
  deviceId: string
  
  // Actions
  addPendingChange: (action: SyncAction) => string
  markSynced: (id: string) => void
  markFailed: (id: string, error: string) => void
  removeSynced: () => void
  updateLastSyncedAt: () => void
  
  // Getters
  getPendingCount: () => number
  getFailedCount: () => number
  getPendingChanges: () => Record<string, SyncAction>
}

const DEVICE_ID = typeof window !== 'undefined' 
  ? localStorage.getItem('device-id') || (() => {
      const id = uuidv4()
      localStorage.setItem('device-id', id)
      return id
    })()
  : 'server-' + uuidv4()

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      // State
      pendingChanges: {},
      lastSyncedAt: 0,
      deviceId: DEVICE_ID,

      // Actions
      addPendingChange: (action) => {
        const id = uuidv4()
        set(
          produce((draft: SyncStore) => {
            draft.pendingChanges[id] = action
          })
        )
        return id
      },

      markSynced: (id) =>
        set(
          produce((draft: SyncStore) => {
            if (draft.pendingChanges[id]) {
              draft.pendingChanges[id].synced = true
            }
          })
        ),

      markFailed: (id, error) =>
        set(
          produce((draft: SyncStore) => {
            if (draft.pendingChanges[id]) {
              draft.pendingChanges[id].retryCount++
              draft.pendingChanges[id].lastError = error
            }
          })
        ),

      removeSynced: () =>
        set(
          produce((draft: SyncStore) => {
            Object.keys(draft.pendingChanges).forEach(id => {
              if (draft.pendingChanges[id].synced) {
                delete draft.pendingChanges[id]
              }
            })
          })
        ),

      updateLastSyncedAt: () =>
        set({ lastSyncedAt: Date.now() }),

      // Getters
      getPendingCount: () => {
        const { pendingChanges } = get()
        return Object.values(pendingChanges).filter(change => !change.synced).length
      },

      getFailedCount: () => {
        const { pendingChanges } = get()
        return Object.values(pendingChanges).filter(change => change.retryCount > 0 && !change.synced).length
      },

      getPendingChanges: () => {
        const { pendingChanges } = get()
        return pendingChanges
      },
    }),
    {
      name: 'sync-metadata-storage',
      partialize: (state) => ({
        pendingChanges: state.pendingChanges,
        lastSyncedAt: state.lastSyncedAt,
        deviceId: state.deviceId,
      }),
    }
  )
) 