import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from './sync-engine'
import { useAppStore } from '@/store/app-store'
import { findTaskAtPath, findProjectAtPath } from '@/lib/task-utils'
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

// Methods for app-store to use to easily sync changes with the backend
export const trackProjectCreated = (projectId: string) => {
  const { projects } = useAppStore.getState()
  const project = projects.find(p => p.id === projectId)
  
  if (project) {
    trackChange(project.id, 'create', {
      entityType: 'project',
      ...project,
    })
  }
}

export const trackProjectUpdated = (projectId: string) => {
  const { projects } = useAppStore.getState()
  const project = projects.find(p => p.id === projectId)
  
  if (project) {
    trackChange(project.id, 'update', {
      entityType: 'project',
      ...project,
    })
  }
}

export const trackProjectDeleted = (projectId: string) => {
  trackChange(projectId, 'delete', {
    entityType: 'project',
  })
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
    
    trackChange(newTask.id, 'create', {
      entityType: 'task',
      projectId,
      parentId,
      ...newTask,
    })
  }
}

export const trackTaskUpdated = (taskPath: string[]) => {
  const { projects } = useAppStore.getState()
  const task = findTaskAtPath(projects, taskPath)
  
  if (task && taskPath.length > 0) {
    const projectId = taskPath[0]
    const parentId = taskPath.length > 2 ? taskPath[taskPath.length - 2] : undefined
    
    trackChange(task.id, 'update', {
      entityType: 'task',
      projectId,
      parentId,
      ...task,
    })
  }
}

export const trackTaskDeleted = (itemPath: string[]) => {
  const taskId = itemPath[itemPath.length - 1]
  const projectId = itemPath[0]
  const parentId = itemPath.length > 2 ? itemPath[itemPath.length - 2] : undefined
  
  trackChange(taskId, 'delete', {
    entityType: 'task',
    projectId,
    parentId,
  })
} 