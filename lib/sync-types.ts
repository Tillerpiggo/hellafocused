// Clear type definitions
export type SyncActionType = 'create' | 'update' | 'delete'

export interface SyncAction {
  id: string
  type: SyncActionType
  timestamp: number
  data: any
  synced: boolean
  retryCount: number
  lastError?: string
}

export interface SyncMetadata {
  pendingChanges: Record<string, SyncAction>
  lastSyncedAt: number
  deviceId: string
} 