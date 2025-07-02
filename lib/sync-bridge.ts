import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from './sync-engine'
import { useAppStore } from '@/store/app-store'
import { findTaskAtPath, findProjectAtPath } from '@/lib/task-utils'
import type { SyncActionType, SyncData, SyncAction } from './sync-types'
import { TaskData } from './types'

// Bridge function that intercepts mutations
export const trackChange = (
  type: SyncActionType, 
  entityType: 'project' | 'task',
  entityId: string,
  data: SyncData,
  projectId?: string,
  parentId?: string
) => {
  console.log(`🔄 trackChange called:`, { type, entityType, entityId, projectId, parentId })
  
  // Create SyncAction - sync store will manage ID separately
  const action: SyncAction = {
    type,
    entityType,
    entityId,
    projectId,
    parentId,
    timestamp: Date.now(),
    data,
    synced: false,
    retryCount: 0,
  }
  
  console.log(`📝 Created sync action:`, action)
  
  // Add to queue - sync store will assign and return ID
  const syncActionId = useSyncStore.getState().addPendingChange(action)
  console.log(`✅ Added to sync store with ID: ${syncActionId}`)
  
  // Try to sync immediately (non-blocking)
  console.log(`🚀 Attempting immediate sync for ID: ${syncActionId}`)
  syncEngine.syncSingleChange(syncActionId).catch((error) => {
    console.error(`❌ Immediate sync failed for ${syncActionId}:`, error)
    // Silently fail, will retry in periodic sync
  })
}

// Methods for app-store to use to easily sync changes with the backend
export const trackProjectCreated = (projectId: string) => {
  console.log(`📁 trackProjectCreated called for: ${projectId}`)
  const { projects } = useAppStore.getState()
  const project = projects.find(p => p.id === projectId)
  
  if (project) {
    console.log(`📁 Found project to sync:`, project)
    trackChange('create', 'project', projectId, project)
  } else {
    console.warn(`⚠️ Project not found for ID: ${projectId}`)
  }
}

export const trackProjectUpdated = (projectId: string) => {
  console.log(`📝 trackProjectUpdated called for: ${projectId}`)
  const { projects } = useAppStore.getState()
  const project = projects.find(p => p.id === projectId)
  
  if (project) {
    console.log(`📝 Found project to update:`, project)
    trackChange('update', 'project', projectId, project)
  } else {
    console.warn(`⚠️ Project not found for ID: ${projectId}`)
  }
}

export const trackProjectDeleted = (projectId: string) => {
  console.log(`🗑️ trackProjectDeleted called for: ${projectId}`)
  trackChange('delete', 'project', projectId, null)
}

export const trackTaskCreated = (parentPath: string[]) => {
  console.log(`✅ trackTaskCreated called with parentPath:`, parentPath)
  const { projects } = useAppStore.getState()
  
  // Find the newly created task (last one in the parent's task list)
  let newTask: TaskData | undefined
  
  if (parentPath.length === 1) {
    // Task added to project root
    console.log(`📂 Looking for task in project root: ${parentPath[0]}`)
    const project = findProjectAtPath(projects, parentPath)
    if (project && project.tasks.length > 0) {
      newTask = project.tasks[project.tasks.length - 1]
      console.log(`📂 Found new task in project:`, newTask)
    } else {
      console.warn(`⚠️ No tasks found in project or project not found`)
    }
  } else {
    // Task added to parent task
    console.log(`📂 Looking for task in parent task: ${parentPath}`)
    const parentTask = findTaskAtPath(projects, parentPath)
    if (parentTask && parentTask.subtasks.length > 0) {
      newTask = parentTask.subtasks[parentTask.subtasks.length - 1]
      console.log(`📂 Found new subtask:`, newTask)
    } else {
      console.warn(`⚠️ No subtasks found in parent or parent not found`)
    }
  }
  
  if (newTask) {
    const projectId = parentPath[0]
    const parentId = parentPath.length > 1 ? parentPath[parentPath.length - 1] : undefined
    
    console.log(`✅ Tracking task creation:`, { taskId: newTask.id, projectId, parentId })
    trackChange('create', 'task', newTask.id, newTask, projectId, parentId)
  } else {
    console.error(`❌ Failed to find newly created task for parentPath:`, parentPath)
  }
}

export const trackTaskUpdated = (taskPath: string[]) => {
  console.log(`📝 trackTaskUpdated called with taskPath:`, taskPath)
  const { projects } = useAppStore.getState()
  const task = findTaskAtPath(projects, taskPath)
  
  if (task && taskPath.length > 0) {
    const projectId = taskPath[0]
    const parentId = taskPath.length > 2 ? taskPath[taskPath.length - 2] : undefined
    
    console.log(`📝 Tracking task update:`, { taskId: task.id, projectId, parentId })
    trackChange('update', 'task', task.id, task, projectId, parentId)
  } else {
    console.warn(`⚠️ Task not found for path:`, taskPath)
  }
}

export const trackTaskDeleted = (itemPath: string[]) => {
  console.log(`🗑️ trackTaskDeleted called with itemPath:`, itemPath)
  const taskId = itemPath[itemPath.length - 1]
  const projectId = itemPath[0]
  const parentId = itemPath.length > 2 ? itemPath[itemPath.length - 2] : undefined
  
  console.log(`🗑️ Tracking task deletion:`, { taskId, projectId, parentId })
  trackChange('delete', 'task', taskId, null, projectId, parentId)
} 