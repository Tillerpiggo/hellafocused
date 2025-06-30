import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from './sync-engine'
import type { ProjectData, TaskItemData } from './types'
import type { SyncActionType } from './sync-types'

// Bridge function that intercepts mutations
export const trackChange = (id: string, type: SyncActionType, data: any) => {
  // Add to queue
  useSyncStore.getState().addPendingChange(id, type, data)
  
  // Try to sync immediately (non-blocking)
  syncEngine.syncSingleChange(id).catch(() => {
    // Silently fail, will retry in periodic sync
  })
}

// Convenience functions for common operations
export const trackProjectCreated = (project: ProjectData) => {
  trackChange(project.id, 'create', {
    entityType: 'project',
    id: project.id,
    ...project,
  })
}

export const trackProjectUpdated = (project: ProjectData) => {
  trackChange(project.id, 'update', {
    entityType: 'project',
    id: project.id,
    ...project,
  })
}

export const trackProjectDeleted = (projectId: string) => {
  trackChange(projectId, 'delete', {
    entityType: 'project',
    id: projectId,
  })
}

export const trackTaskCreated = (task: TaskItemData, projectId: string, parentId?: string) => {
  trackChange(task.id, 'create', {
    entityType: 'task',
    id: task.id,
    projectId,
    parentId,
    ...task,
  })
}

export const trackTaskUpdated = (task: TaskItemData, projectId: string, parentId?: string) => {
  trackChange(task.id, 'update', {
    entityType: 'task',
    id: task.id,
    projectId,
    parentId,
    ...task,
  })
}

export const trackTaskDeleted = (taskId: string, projectId: string, parentId?: string) => {
  trackChange(taskId, 'delete', {
    entityType: 'task',
    id: taskId,
    projectId,
    parentId,
  })
} 