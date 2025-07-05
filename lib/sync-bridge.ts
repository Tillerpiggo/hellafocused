import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from './sync-engine'
import { useAppStore } from '@/store/app-store'
import { findTaskAtPath } from '@/lib/task-utils'
import type { SyncActionType, SyncData, SyncAction } from './sync-types'

// Bridge function that intercepts mutations
export const trackChange = (
  type: SyncActionType, 
  entityType: 'project' | 'task',
  entityId: string,
  data: SyncData,
  projectId?: string,
  parentId?: string
) => {
  // Create SyncAction - sync store will handle user ID and only create if logged in
  const action: SyncAction = {
    type,
    entityType,
    entityId,
    userId: '', // Will be set by sync store
    projectId,
    parentId,
    timestamp: Date.now(),
    data,
    synced: false,
    retryCount: 0,
  }

  // Add to queue - sync store will assign ID and user ID, or return null if no user
  const syncActionId = useSyncStore.getState().addPendingChange(action)
  
  if (syncActionId) {
    // Try to sync immediately (non-blocking)
    syncEngine.syncSingleChange(syncActionId).catch((error) => {
      console.error(`❌ Immediate sync failed for ${syncActionId}:`, error)
      // Silently fail, will retry in periodic sync
    })
  }
}

// Methods for app-store to use to easily sync changes with the backend
export const trackProjectCreated = (projectId: string) => {
  const { projects } = useAppStore.getState()
  const project = projects.find(p => p.id === projectId)
  
  if (project) {
    trackChange('create', 'project', projectId, project)
  } else {
    console.warn(`⚠️ Project not found for ID: ${projectId}`)
  }
}

export const trackProjectUpdated = (projectId: string) => {
  const { projects } = useAppStore.getState()
  const project = projects.find(p => p.id === projectId)
  
  if (project) {
    trackChange('update', 'project', projectId, project)
  } else {
    console.warn(`⚠️ Project not found for ID: ${projectId}`)
  }
}

export const trackProjectDeleted = (projectId: string) => {
  trackChange('delete', 'project', projectId, null)
}

export const trackTaskCreated = (parentPath: string[]) => {
  const { projects } = useAppStore.getState()
  const projectId = parentPath[0]

  // Find the most recently added task
  if (parentPath.length === 1) {
    // Task added to project root
    const project = projects.find(p => p.id === projectId)
    if (!project || project.tasks.length === 0) {
      console.warn(`⚠️ No tasks found in project or project not found`)
      return
    }
    const newTask = project.tasks[project.tasks.length - 1]
    trackChange('create', 'task', newTask.id, newTask, projectId)
  } else {
    // Task added to a parent task
    const parentTask = findTaskAtPath(projects, parentPath)
    if (!parentTask || parentTask.subtasks.length === 0) {
      console.warn(`⚠️ No subtasks found in parent or parent not found`)
      return
    }
    const newTask = parentTask.subtasks[parentTask.subtasks.length - 1]
    const parentId = parentPath[parentPath.length - 1]
    
    trackChange('create', 'task', newTask.id, newTask, projectId, parentId)
  }
}

export const trackTaskUpdated = (taskPath: string[]) => {
  const { projects } = useAppStore.getState()
  const task = findTaskAtPath(projects, taskPath)
  const projectId = taskPath[0]
  
  if (task) {
    // Determine parent ID if this task has a parent
    const parentId = taskPath.length > 2 ? taskPath[taskPath.length - 2] : undefined
    trackChange('update', 'task', task.id, task, projectId, parentId)
  } else {
    console.warn(`⚠️ Task not found for path:`, taskPath)
  }
}

export const trackTaskDeleted = (taskPath: string[]) => {
  const taskId = taskPath[taskPath.length - 1]
  const projectId = taskPath[0]
  const parentId = taskPath.length > 2 ? taskPath[taskPath.length - 2] : undefined
  
  trackChange('delete', 'task', taskId, null, projectId, parentId)
} 