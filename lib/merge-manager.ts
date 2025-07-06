import { type DatabaseProject, type DatabaseTask } from './supabase'
import { useAppStore } from '@/store/app-store'
import { useSyncStore } from '@/store/sync-store'
import type { ProjectData, TaskData } from './types'
import type { SyncAction } from './sync-types'

export class MergeManager {
  async mergeCloudWithLocal(cloudProjects: DatabaseProject[], cloudTasks: DatabaseTask[]) {
    const localProjects = useAppStore.getState().projects
    const { pendingChanges } = useSyncStore.getState()
    
    // Build lookup maps for efficient merging
    const localProjectMap = new Map(localProjects.map(p => [p.id, p]))
    const cloudProjectMap = new Map(cloudProjects.map(p => [p.id, p]))
    
    // Build a flat map of all local tasks for efficient lookup
    const localTaskMap = new Map<string, TaskData>()
    const buildLocalTaskMap = (tasks: TaskData[]) => {
      tasks.forEach(task => {
        localTaskMap.set(task.id, task)
        if (task.subtasks) {
          buildLocalTaskMap(task.subtasks)
        }
      })
    }
    localProjects.forEach(project => buildLocalTaskMap(project.tasks))
    
    const mergedProjects: ProjectData[] = []
    
    // 1. Process all cloud projects (source of truth)
    for (const cloudProject of cloudProjects) {
      const localProject = localProjectMap.get(cloudProject.id)
      const hasPendingProjectChanges = Object.values(pendingChanges).some(
        (change: SyncAction) => change.entityId === cloudProject.id && change.entityType === 'project' && !change.synced
      )
      
      let mergedProject: ProjectData
      
      if (!localProject) {
        // Project only exists in cloud - add it
        mergedProject = this.convertCloudProjectToLocal(cloudProject, cloudTasks)
      } else if (hasPendingProjectChanges) {
        // Local project has pending changes - keep local version for now
        mergedProject = { ...localProject }
        // Merge tasks with sophisticated strategy
        mergedProject.tasks = this.mergeProjectTasks(localProject, cloudProject, cloudTasks, pendingChanges)
      } else {
        // No pending changes - use field-level merge with remote as source of truth
        mergedProject = this.mergeProject(localProject, cloudProject, cloudTasks, pendingChanges)
      }
      
      mergedProjects.push(mergedProject)
    }
    
    // 2. Add local-only projects only if they have pending changes
    for (const localProject of localProjects) {
      if (!cloudProjectMap.has(localProject.id)) {
        const hasPendingChanges = Object.values(pendingChanges).some(
          (change: SyncAction) => change.entityId === localProject.id && change.entityType === 'project' && !change.synced
        )
        if (hasPendingChanges) {
          mergedProjects.push({ ...localProject })
        }
      }
    }
    
    // 3. Update the app store with merged data
    useAppStore.setState({ projects: mergedProjects })
  }

  private convertCloudProjectToLocal(cloudProject: DatabaseProject, cloudTasks: DatabaseTask[]): ProjectData {
    const projectTasks = cloudTasks
      .filter(task => task.project_id === cloudProject.id && !task.parent_id)
      .map(task => this.convertTaskToLocal(task, cloudTasks))

    return {
      id: cloudProject.id,
      name: cloudProject.name,
      lastModificationDate: cloudProject.updated_at,
      tasks: projectTasks,
    }
  }

  private convertTaskToLocal(cloudTask: DatabaseTask, allTasks: DatabaseTask[]): TaskData {
    // Find all subtasks of this task
    const subtasks = allTasks
      .filter(task => task.parent_id === cloudTask.id)
      .map(task => this.convertTaskToLocal(task, allTasks))

    return {
      id: cloudTask.id,
      name: cloudTask.name,
      completed: cloudTask.completed,
      completionDate: cloudTask.completion_date || undefined,
      lastModificationDate: cloudTask.updated_at,
      subtasks,
    }
  }

  private mergeProject(
    localProject: ProjectData, 
    cloudProject: DatabaseProject, 
    cloudTasks: DatabaseTask[], 
    pendingChanges: Record<string, SyncAction>
  ): ProjectData {
    // Field-level merge with remote as source of truth, using lastModificationDate for last-write wins
    const cloudUpdateDate = cloudProject.updated_at
    const useCloudProject = cloudUpdateDate > localProject.lastModificationDate
    
    const merged: ProjectData = {
      id: cloudProject.id,
      name: useCloudProject ? cloudProject.name : localProject.name,
      lastModificationDate: useCloudProject ? cloudUpdateDate : localProject.lastModificationDate,
      tasks: this.mergeProjectTasks(localProject, cloudProject, cloudTasks, pendingChanges)
    }
    
    return merged
  }

  private mergeProjectTasks(
    localProject: ProjectData,
    cloudProject: DatabaseProject,
    allCloudTasks: DatabaseTask[],
    pendingChanges: Record<string, SyncAction>
  ): TaskData[] {
    const cloudTasks = allCloudTasks.filter(t => t.project_id === cloudProject.id && !t.parent_id)
    const localTaskMap = new Map(localProject.tasks.map(t => [t.id, t]))
    const cloudTaskMap = new Map(cloudTasks.map(t => [t.id, t]))
    
    const mergedTasks: TaskData[] = []
    
    // Process cloud tasks (source of truth)
    for (const cloudTask of cloudTasks) {
      const localTask = localTaskMap.get(cloudTask.id)
      const mergedTask = this.mergeTask(localTask, cloudTask, allCloudTasks, pendingChanges)
      mergedTasks.push(mergedTask)
    }
    
    // Add local-only tasks only if they have pending changes
    for (const localTask of localProject.tasks) {
      if (!cloudTaskMap.has(localTask.id)) {
        const hasPendingChanges = Object.values(pendingChanges).some(
          (change: SyncAction) => change.entityId === localTask.id && change.entityType === 'task' && !change.synced
        )
        if (hasPendingChanges) {
          mergedTasks.push({ ...localTask })
        }
      }
    }
    
    return mergedTasks
  }

  private mergeTask(
    localTask: TaskData | undefined,
    cloudTask: DatabaseTask,
    allCloudTasks: DatabaseTask[],
    pendingChanges: Record<string, SyncAction>
  ): TaskData {
    const hasPendingChanges = Object.values(pendingChanges).some(
      (change: SyncAction) => change.entityId === cloudTask.id && change.entityType === 'task' && !change.synced
    )
    
    if (!localTask) {
      // Task only exists in cloud
      return this.convertTaskToLocal(cloudTask, allCloudTasks)
    }
    
    if (hasPendingChanges) {
      // Local task has pending changes - keep local version but merge subtasks
      return {
        ...localTask,
        subtasks: this.mergeTaskSubtasks(localTask, cloudTask, allCloudTasks, pendingChanges)
      }
    }
    
    // Field-level merge with remote as source of truth, using lastModificationDate for last-write wins
    const cloudUpdateDate = cloudTask.updated_at
    const useCloudTask = cloudUpdateDate > localTask.lastModificationDate
    
    return {
      id: cloudTask.id,
      name: useCloudTask ? cloudTask.name : localTask.name,
      completed: useCloudTask ? cloudTask.completed : localTask.completed,
      completionDate: useCloudTask ? (cloudTask.completion_date || undefined) : localTask.completionDate,
      lastModificationDate: useCloudTask ? cloudUpdateDate : localTask.lastModificationDate,
      subtasks: this.mergeTaskSubtasks(localTask, cloudTask, allCloudTasks, pendingChanges)
    }
  }

  private mergeTaskSubtasks(
    localTask: TaskData,
    cloudTask: DatabaseTask,
    allCloudTasks: DatabaseTask[],
    pendingChanges: Record<string, SyncAction>
  ): TaskData[] {
    const cloudSubtasks = allCloudTasks.filter(t => t.parent_id === cloudTask.id)
    const localSubtaskMap = new Map((localTask.subtasks || []).map(t => [t.id, t]))
    const cloudSubtaskMap = new Map(cloudSubtasks.map(t => [t.id, t]))
    
    const mergedSubtasks: TaskData[] = []
    
    // Process cloud subtasks
    for (const cloudSubtask of cloudSubtasks) {
      const localSubtask = localSubtaskMap.get(cloudSubtask.id)
      const mergedSubtask = this.mergeTask(localSubtask, cloudSubtask, allCloudTasks, pendingChanges)
      mergedSubtasks.push(mergedSubtask)
    }
    
    // Add local-only subtasks only if they have pending changes
    for (const localSubtask of (localTask.subtasks || [])) {
      if (!cloudSubtaskMap.has(localSubtask.id)) {
        const hasPendingChanges = Object.values(pendingChanges).some(
          (change: SyncAction) => change.entityId === localSubtask.id && change.entityType === 'task' && !change.synced
        )
        if (hasPendingChanges) {
          mergedSubtasks.push({ ...localSubtask })
        }
      }
    }
    
    return mergedSubtasks
  }
}

// Global merge manager instance
export const mergeManager = new MergeManager() 