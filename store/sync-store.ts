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
        console.log(`🏪 SyncStore.addPendingChange called with:`, action)
        const id = uuidv4()
        console.log(`🏪 Generated sync action ID: ${id}`)
        set(
          produce((draft: SyncStore) => {
            draft.pendingChanges[id] = action
            console.log(`🏪 Added to pendingChanges. Total pending: ${Object.keys(draft.pendingChanges).length}`)
          })
        )
        return id
      },

      markSynced: (id) => {
        console.log(`🏪 SyncStore.markSynced called for ID: ${id}`)
        set(
          produce((draft: SyncStore) => {
            if (draft.pendingChanges[id]) {
              draft.pendingChanges[id].synced = true
              console.log(`🏪 Marked ${id} as synced`)
            } else {
              console.warn(`🏪 Sync action ${id} not found when marking synced`)
            }
          })
        )
      },

      markFailed: (id, error) => {
        console.log(`🏪 SyncStore.markFailed called for ID: ${id}, error: ${error}`)
        set(
          produce((draft: SyncStore) => {
            if (draft.pendingChanges[id]) {
              draft.pendingChanges[id].retryCount++
              draft.pendingChanges[id].lastError = error
              console.log(`🏪 Marked ${id} as failed. Retry count: ${draft.pendingChanges[id].retryCount}`)
            } else {
              console.warn(`🏪 Sync action ${id} not found when marking failed`)
            }
          })
        )
      },

      removeSynced: () => {
        console.log(`🏪 SyncStore.removeSynced called`)
        set(
          produce((draft: SyncStore) => {
            const beforeCount = Object.keys(draft.pendingChanges).length
            Object.keys(draft.pendingChanges).forEach(id => {
              if (draft.pendingChanges[id].synced) {
                delete draft.pendingChanges[id]
              }
            })
            const afterCount = Object.keys(draft.pendingChanges).length
            console.log(`🏪 Removed synced changes. Before: ${beforeCount}, After: ${afterCount}`)
          })
        )
      },

      updateLastSyncedAt: () => {
        console.log(`🏪 SyncStore.updateLastSyncedAt called`)
        set({ lastSyncedAt: Date.now() })
      },

      // Getters
      getPendingCount: () => {
        const { pendingChanges } = get()
        const count = Object.values(pendingChanges).filter(change => !change.synced).length
        console.log(`🏪 SyncStore.getPendingCount: ${count}`)
        return count
      },

      getFailedCount: () => {
        const { pendingChanges } = get()
        const count = Object.values(pendingChanges).filter(change => change.retryCount > 0 && !change.synced).length
        console.log(`🏪 SyncStore.getFailedCount: ${count}`)
        return count
      },

      getPendingChanges: () => {
        const { pendingChanges } = get()
        console.log(`🏪 SyncStore.getPendingChanges called. Count: ${Object.keys(pendingChanges).length}`)
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