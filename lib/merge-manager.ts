import { type DatabaseProject, type DatabaseTask } from './supabase'
import { useAppStore } from '@/store/app-store'
import { useSyncStore } from '@/store/sync-store'
import type { ProjectData, TaskItemData } from './types'

export class MergeManager {
  async mergeCloudWithLocal(cloudProjects: DatabaseProject[], cloudTasks: DatabaseTask[]) {
    console.log('🔧 Performing sophisticated merge with last-write wins strategy...')
    
    const localProjects = useAppStore.getState().projects
    const { pendingChanges } = useSyncStore.getState()
    
    // Build lookup maps for efficient merging
    const localProjectMap = new Map(localProjects.map(p => [p.id, p]))
    const cloudProjectMap = new Map(cloudProjects.map(p => [p.id, p]))
    
    // Build a flat map of all local tasks for efficient lookup
    const localTaskMap = new Map<string, TaskItemData>()
    const buildLocalTaskMap = (tasks: TaskItemData[]) => {
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
        change => change.entityId === cloudProject.id && change.entityType === 'project' && !change.synced
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
    
    // 2. Add local-only projects (they will be synced up later)
    for (const localProject of localProjects) {
      if (!cloudProjectMap.has(localProject.id)) {
        mergedProjects.push({ ...localProject })
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
      tasks: projectTasks,
    }
  }

  private convertTaskToLocal(cloudTask: DatabaseTask, allTasks: DatabaseTask[]): TaskItemData {
    // Find all subtasks of this task
    const subtasks = allTasks
      .filter(task => task.parent_id === cloudTask.id)
      .map(task => this.convertTaskToLocal(task, allTasks))

    return {
      id: cloudTask.id,
      name: cloudTask.name,
      completed: cloudTask.completed,
      completionDate: cloudTask.completion_date || undefined,
      subtasks,
    }
  }

  private mergeProject(
    localProject: ProjectData, 
    cloudProject: DatabaseProject, 
    cloudTasks: DatabaseTask[], 
    pendingChanges: any
  ): ProjectData {
    // Field-level merge with remote as source of truth
    const merged: ProjectData = {
      id: cloudProject.id,
      name: cloudProject.name,
      tasks: this.mergeProjectTasks(localProject, cloudProject, cloudTasks, pendingChanges)
    }
    
    return merged
  }

  private mergeProjectTasks(
    localProject: ProjectData,
    cloudProject: DatabaseProject,
    allCloudTasks: DatabaseTask[],
    pendingChanges: any
  ): TaskItemData[] {
    const cloudTasks = allCloudTasks.filter(t => t.project_id === cloudProject.id && !t.parent_id)
    const localTaskMap = new Map(localProject.tasks.map(t => [t.id, t]))
    const cloudTaskMap = new Map(cloudTasks.map(t => [t.id, t]))
    
    const mergedTasks: TaskItemData[] = []
    
    // Process cloud tasks (source of truth)
    for (const cloudTask of cloudTasks) {
      const localTask = localTaskMap.get(cloudTask.id)
      const mergedTask = this.mergeTask(localTask, cloudTask, allCloudTasks, pendingChanges)
      mergedTasks.push(mergedTask)
    }
    
    // Add local-only tasks
    for (const localTask of localProject.tasks) {
      if (!cloudTaskMap.has(localTask.id)) {
        mergedTasks.push({ ...localTask })
      }
    }
    
    return mergedTasks
  }

  private mergeTask(
    localTask: TaskItemData | undefined,
    cloudTask: DatabaseTask,
    allCloudTasks: DatabaseTask[],
    pendingChanges: any
  ): TaskItemData {
    const hasPendingChanges = Object.values(pendingChanges).some(
      (change: any) => change.entityId === cloudTask.id && change.entityType === 'task' && !change.synced
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
    
    // Field-level merge with remote as source of truth
    return {
      id: cloudTask.id,
      name: cloudTask.name,
      completed: cloudTask.completed,
      completionDate: cloudTask.completion_date || undefined,
      subtasks: this.mergeTaskSubtasks(localTask, cloudTask, allCloudTasks, pendingChanges)
    }
  }

  private mergeTaskSubtasks(
    localTask: TaskItemData,
    cloudTask: DatabaseTask,
    allCloudTasks: DatabaseTask[],
    pendingChanges: any
  ): TaskItemData[] {
    const cloudSubtasks = allCloudTasks.filter(t => t.parent_id === cloudTask.id)
    const localSubtaskMap = new Map((localTask.subtasks || []).map(t => [t.id, t]))
    const cloudSubtaskMap = new Map(cloudSubtasks.map(t => [t.id, t]))
    
    const mergedSubtasks: TaskItemData[] = []
    
    // Process cloud subtasks
    for (const cloudSubtask of cloudSubtasks) {
      const localSubtask = localSubtaskMap.get(cloudSubtask.id)
      const mergedSubtask = this.mergeTask(localSubtask, cloudSubtask, allCloudTasks, pendingChanges)
      mergedSubtasks.push(mergedSubtask)
    }
    
    // Add local-only subtasks
    for (const localSubtask of (localTask.subtasks || [])) {
      if (!cloudSubtaskMap.has(localSubtask.id)) {
        mergedSubtasks.push({ ...localSubtask })
      }
    }
    
    return mergedSubtasks
  }
}

// Global merge manager instance
export const mergeManager = new MergeManager() 