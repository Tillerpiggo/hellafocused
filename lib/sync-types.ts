import type { TaskData, ProjectData } from './types'

// Clear type definitions
export type SyncActionType = 'create' | 'update' | 'delete'

// Simple sync data - can be project, task, or null for deletions
export type SyncData = ProjectData | TaskData | null

export interface SyncAction {
  type: SyncActionType
  entityType: 'project' | 'task'
  entityId: string // The ID of the entity being synced (project ID or task ID)
  userId: string // The user ID who created this change
  projectId?: string // For tasks, which project they belong to
  parentId?: string // For tasks, which parent task (if any)
  timestamp: number
  data: SyncData
  synced: boolean
  retryCount: number
  lastError?: string
}

export interface SyncMetadata {
  pendingChanges: Record<string, SyncAction>
  lastSyncedAt: number
  deviceId: string
} 