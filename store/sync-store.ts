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
        console.log(`🏪 SyncStore.addPendingChange called with:`)
        console.log(`🏪   action.type: ${action.type}`)
        console.log(`🏪   action.entityType: ${action.entityType}`)
        console.log(`🏪   action.entityId: ${action.entityId}`)
        console.log(`🏪   action.timestamp: ${action.timestamp}`)
        console.log(`🏪   store.deviceId: ${get().deviceId}`)
        console.log(`🏪   Full action:`, action)
        
        const id = uuidv4()
        console.log(`🏪 Generated sync action ID: ${id}`)
        
        const beforeCount = Object.keys(get().pendingChanges).length
        set(
          produce((draft: SyncStore) => {
            draft.pendingChanges[id] = action
            const afterCount = Object.keys(draft.pendingChanges).length
            console.log(`🏪 Added to pendingChanges. Before: ${beforeCount}, After: ${afterCount}`)
            console.log(`🏪 Pending changes now:`, Object.keys(draft.pendingChanges))
          })
        )
        console.log(`🏪 addPendingChange completed, returning ID: ${id}`)
        return id
      },

      markSynced: (id) => {
        console.log(`🏪 SyncStore.markSynced called for ID: ${id}`)
        const currentChange = get().pendingChanges[id]
        if (currentChange) {
          console.log(`🏪 Found change to mark as synced:`)
          console.log(`🏪   type: ${currentChange.type}`)
          console.log(`🏪   entityType: ${currentChange.entityType}`)
          console.log(`🏪   entityId: ${currentChange.entityId}`)
        }
        
        set(
          produce((draft: SyncStore) => {
            if (draft.pendingChanges[id]) {
              draft.pendingChanges[id].synced = true
              console.log(`🏪 Marked ${id} as synced`)
              console.log(`🏪 Synced change details:`, draft.pendingChanges[id])
            } else {
              console.warn(`🏪 Sync action ${id} not found when marking synced`)
              console.warn(`🏪 Available IDs:`, Object.keys(draft.pendingChanges))
            }
          })
        )
        console.log(`🏪 markSynced completed for ID: ${id}`)
      },

      markFailed: (id, error) => {
        console.log(`🏪 SyncStore.markFailed called for ID: ${id}, error: ${error}`)
        const currentChange = get().pendingChanges[id]
        if (currentChange) {
          console.log(`🏪 Found change to mark as failed:`)
          console.log(`🏪   type: ${currentChange.type}`)
          console.log(`🏪   entityType: ${currentChange.entityType}`)
          console.log(`🏪   current retryCount: ${currentChange.retryCount}`)
        }
        
        set(
          produce((draft: SyncStore) => {
            if (draft.pendingChanges[id]) {
              const oldRetryCount = draft.pendingChanges[id].retryCount
              draft.pendingChanges[id].retryCount++
              draft.pendingChanges[id].lastError = error
              console.log(`🏪 Marked ${id} as failed. Retry count: ${oldRetryCount} -> ${draft.pendingChanges[id].retryCount}`)
              console.log(`🏪 Error details: ${error}`)
            } else {
              console.warn(`🏪 Sync action ${id} not found when marking failed`)
              console.warn(`🏪 Available IDs:`, Object.keys(draft.pendingChanges))
            }
          })
        )
        console.log(`🏪 markFailed completed for ID: ${id}`)
      },

      removeSynced: () => {
        console.log(`🏪 SyncStore.removeSynced called`)
        const currentChanges = get().pendingChanges
        const syncedIds = Object.keys(currentChanges).filter(id => currentChanges[id].synced)
        console.log(`🏪 Found ${syncedIds.length} synced changes to remove:`, syncedIds)
        
        set(
          produce((draft: SyncStore) => {
            const beforeCount = Object.keys(draft.pendingChanges).length
            const syncedChanges: string[] = []
            Object.keys(draft.pendingChanges).forEach(id => {
              if (draft.pendingChanges[id].synced) {
                console.log(`🏪 Removing synced change ${id}: ${draft.pendingChanges[id].type} ${draft.pendingChanges[id].entityType}`)
                syncedChanges.push(id)
                delete draft.pendingChanges[id]
              }
            })
            const afterCount = Object.keys(draft.pendingChanges).length
            console.log(`🏪 Removed ${syncedChanges.length} synced changes. Before: ${beforeCount}, After: ${afterCount}`)
            console.log(`🏪 Remaining pending IDs:`, Object.keys(draft.pendingChanges))
          })
        )
        console.log(`🏪 removeSynced completed`)
      },

      updateLastSyncedAt: () => {
        const timestamp = Date.now()
        console.log(`🏪 SyncStore.updateLastSyncedAt called`)
        console.log(`🏪 Setting lastSyncedAt to: ${timestamp} (${new Date(timestamp).toISOString()})`)
        set({ lastSyncedAt: timestamp })
        console.log(`🏪 updateLastSyncedAt completed`)
      },

      // Getters
      getPendingCount: () => {
        const { pendingChanges } = get()
        const unsyncedChanges = Object.values(pendingChanges).filter(change => !change.synced)
        const count = unsyncedChanges.length
        console.log(`🏪 SyncStore.getPendingCount: ${count}`)
        console.log(`🏪   Total changes: ${Object.keys(pendingChanges).length}`)
        console.log(`🏪   Unsynced changes: ${count}`)
        if (unsyncedChanges.length > 0) {
          console.log(`🏪   Unsynced change types:`, unsyncedChanges.map(c => `${c.type}:${c.entityType}`))
        }
        return count
      },

      getFailedCount: () => {
        const { pendingChanges } = get()
        const failedChanges = Object.values(pendingChanges).filter(change => change.retryCount > 0 && !change.synced)
        const count = failedChanges.length
        console.log(`🏪 SyncStore.getFailedCount: ${count}`)
        if (failedChanges.length > 0) {
          console.log(`🏪   Failed changes:`, failedChanges.map(c => `${c.type}:${c.entityType} (retries: ${c.retryCount})`))
        }
        return count
      },

      getPendingChanges: () => {
        const { pendingChanges } = get()
        console.log(`🏪 SyncStore.getPendingChanges called. Count: ${Object.keys(pendingChanges).length}`)
        console.log(`🏪   Pending change IDs:`, Object.keys(pendingChanges))
        const changesSummary = Object.entries(pendingChanges).map(([id, change]) => ({
          id,
          type: change.type,
          entityType: change.entityType,
          synced: change.synced,
          retryCount: change.retryCount
        }))
        console.log(`🏪   Changes summary:`, changesSummary)
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