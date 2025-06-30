import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from './sync-engine'
import { useAppStore } from '@/store/app-store'
import { findTaskAtPath, findProjectAtPath } from '@/lib/task-utils'
import type { SyncActionType, SyncData } from './sync-types'
import { TaskItemData } from './types'

// Bridge function that intercepts mutations
export const trackChange = (
  id: string, 
  type: SyncActionType, 
  entityType: 'project' | 'task',
  data: SyncData,
  projectId?: string,
  parentId?: string
) => {
  // Add to queue
  useSyncStore.getState().addPendingChange(id, type, entityType, data, projectId, parentId)
  
  // Try to sync immediately (non-blocking)
  syncEngine.syncSingleChange(id).catch(() => {
    // Silently fail, will retry in periodic sync
  })
}

// Methods for app-store to use to easily sync changes with the backend
export const trackProjectCreated = (projectId: string) => {
  const { projects } = useAppStore.getState()
  const project = projects.find(p => p.id === projectId)
  
  if (project) {
    trackChange(projectId, 'create', 'project', project)
  }
}

export const trackProjectUpdated = (projectId: string) => {
  const { projects } = useAppStore.getState()
  const project = projects.find(p => p.id === projectId)
  
  if (project) {
    trackChange(projectId, 'update', 'project', project)
  }
}

export const trackProjectDeleted = (projectId: string) => {
  trackChange(projectId, 'delete', 'project', null)
}

export const trackTaskCreated = (parentPath: string[]) => {
  const { projects } = useAppStore.getState()
  
  // Find the newly created task (last one in the parent's task list)
  let newTask: TaskItemData | undefined
  
  if (parentPath.length === 1) {
    // Task added to project root
    const project = findProjectAtPath(projects, parentPath)
    if (project && project.tasks.length > 0) {
      newTask = project.tasks[project.tasks.length - 1]
    }
  } else {
    // Task added to parent task
    const parentTask = findTaskAtPath(projects, parentPath)
    if (parentTask && parentTask.subtasks.length > 0) {
      newTask = parentTask.subtasks[parentTask.subtasks.length - 1]
    }
  }
  
  if (newTask) {
    const projectId = parentPath[0]
    const parentId = parentPath.length > 1 ? parentPath[parentPath.length - 1] : undefined
    
    trackChange(newTask.id, 'create', 'task', newTask, projectId, parentId)
  }
}

export const trackTaskUpdated = (taskPath: string[]) => {
  const { projects } = useAppStore.getState()
  const task = findTaskAtPath(projects, taskPath)
  
  if (task && taskPath.length > 0) {
    const projectId = taskPath[0]
    const parentId = taskPath.length > 2 ? taskPath[taskPath.length - 2] : undefined
    
    trackChange(task.id, 'update', 'task', task, projectId, parentId)
  }
}

export const trackTaskDeleted = (itemPath: string[]) => {
  const taskId = itemPath[itemPath.length - 1]
  const projectId = itemPath[0]
  const parentId = itemPath.length > 2 ? itemPath[itemPath.length - 2] : undefined
  
  trackChange(taskId, 'delete', 'task', null, projectId, parentId)
} 