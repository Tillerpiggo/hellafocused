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
  syncLoading: boolean
  isInitialized: boolean
  currentUserId: string | null
  
  // Actions
  addPendingChange: (action: SyncAction) => string | null
  markSynced: (id: string) => void
  markFailed: (id: string, error: string) => void
  removeSynced: () => void
  updateLastSyncedAt: () => void
  setSyncLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  setCurrentUserId: (userId: string | null) => void
  clearSyncState: () => void
  
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
      syncLoading: false,
      isInitialized: false,
      currentUserId: null,

      // Actions
      addPendingChange: (action) => {
        const { currentUserId, pendingChanges } = get()
        
        // Only create pending changes if user is logged in
        if (!currentUserId) {
          return null
        }
        
        // Look for existing pending action for the same entity
        const existingEntry = Object.entries(pendingChanges).find(([, existingAction]) => 
          existingAction.entityId === action.entityId &&
          existingAction.userId === currentUserId &&
          !existingAction.synced
        )
        
        if (existingEntry) {
          const [existingId, existingAction] = existingEntry
          
          // Merge logic based on action types
          const shouldMerge = (() => {
            // Delete supersedes everything
            if (action.type === 'delete') {
              return true
            }
            
            // Can't merge different action types (except delete)
            if (action.type !== existingAction.type) {
              return false
            }
            
            // For same action types, merge if new action is more recent
            return action.timestamp > existingAction.timestamp
          })()
          
          if (shouldMerge) {
            console.log(`🔄 Merging sync action for ${action.entityId}: ${existingAction.type} + ${action.type}`)
            
            set(
              produce((draft: SyncStore) => {
                // For delete actions, preserve the delete but update timestamp
                if (action.type === 'delete') {
                  draft.pendingChanges[existingId] = { 
                    ...action, 
                    userId: currentUserId,
                    // Preserve original retry state
                    retryCount: existingAction.retryCount,
                    lastError: existingAction.lastError
                  }
                } else {
                  // For creates/updates, merge data and update timestamp
                  draft.pendingChanges[existingId] = {
                    ...existingAction,
                    ...action,
                    userId: currentUserId,
                    // Preserve original retry state
                    retryCount: existingAction.retryCount,
                    lastError: existingAction.lastError
                  }
                }
              })
            )
            return existingId
          }
        }
        
        // No existing action to merge with, create new one
        const id = uuidv4()
        
        set(
          produce((draft: SyncStore) => {
            draft.pendingChanges[id] = { ...action, userId: currentUserId }
          })
        )
        return id
      },

      markSynced: (id) => {
        set(
          produce((draft: SyncStore) => {
            if (draft.pendingChanges[id]) {
              draft.pendingChanges[id].synced = true
            } else {
              console.warn(`🏪 Sync action ${id} not found when marking synced`)
            }
          })
        )
      },

      markFailed: (id, error) => {
        set(
          produce((draft: SyncStore) => {
            if (draft.pendingChanges[id]) {
              draft.pendingChanges[id].retryCount++
              draft.pendingChanges[id].lastError = error
            } else {
              console.warn(`🏪 Sync action ${id} not found when marking failed`)
            }
          })
        )
      },

      removeSynced: () => {
        set(
          produce((draft: SyncStore) => {
            Object.keys(draft.pendingChanges).forEach(id => {
              if (draft.pendingChanges[id].synced) {
                delete draft.pendingChanges[id]
              }
            })
          })
        )
      },

      updateLastSyncedAt: () => {
        const timestamp = Date.now()
        set({ lastSyncedAt: timestamp })
      },

      setSyncLoading: (loading) => {
        set({ syncLoading: loading })
      },

      setInitialized: (initialized) => {
        set({ isInitialized: initialized })
      },

      setCurrentUserId: (userId) => {
        set({ currentUserId: userId })
      },

      clearSyncState: () => {
        set({
          lastSyncedAt: 0,
          syncLoading: false,
          isInitialized: false,
          currentUserId: null
          // Keep pendingChanges - they persist across user sessions
        })
      },

      // Getters
      getPendingCount: () => {
        const { pendingChanges, currentUserId } = get()
        
        if (!currentUserId) return 0
        
        const unsyncedChanges = Object.values(pendingChanges).filter(
          change => !change.synced && change.userId === currentUserId
        )
        
        return unsyncedChanges.length
      },

      getFailedCount: () => {
        const { pendingChanges, currentUserId } = get()
        
        if (!currentUserId) return 0
        
        const failedChanges = Object.values(pendingChanges).filter(
          change => change.retryCount > 0 && !change.synced && change.userId === currentUserId
        )
        
        return failedChanges.length
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
        // Exclude isInitialized, currentUserId, and syncLoading - they should reset each session
      }),
    }
  )
) 