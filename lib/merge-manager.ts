import { type DatabaseProject, type DatabaseTask } from './supabase'
import { useAppStore } from '@/store/app-store'
import { useSyncStore } from '@/store/sync-store'
import type { ProjectData, TaskData } from './types'
import type { SyncAction } from './sync-types'
import { fillMissingPositionsForProjects } from './task-utils'

export class MergeManager {
  private buildChildrenMap(cloudTasks: DatabaseTask[]): Map<string | undefined, DatabaseTask[]> {
    const map = new Map<string | undefined, DatabaseTask[]>()
    for (const task of cloudTasks) {
      const key = task.parent_id ?? undefined
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    }
    return map
  }

  private buildPendingEntityIds(pendingChanges: Record<string, SyncAction>): Set<string> {
    const ids = new Set<string>()
    for (const change of Object.values(pendingChanges)) {
      if (!change.synced) {
        ids.add(`${change.entityType}:${change.entityId}`)
      }
    }
    return ids
  }

  async mergeCloudWithLocal(cloudProjects: DatabaseProject[], cloudTasks: DatabaseTask[]) {
    const localProjects = useAppStore.getState().projects
    const { pendingChanges } = useSyncStore.getState()

    const localProjectMap = new Map(localProjects.map(p => [p.id, p]))
    const cloudProjectMap = new Map(cloudProjects.map(p => [p.id, p]))
    const childrenMap = this.buildChildrenMap(cloudTasks)
    const pendingEntityIds = this.buildPendingEntityIds(pendingChanges)

    const mergedProjects: ProjectData[] = []

    for (const cloudProject of cloudProjects) {
      const localProject = localProjectMap.get(cloudProject.id)
      const hasPendingProjectChanges = pendingEntityIds.has(`project:${cloudProject.id}`)

      let mergedProject: ProjectData

      if (!localProject) {
        mergedProject = this.convertCloudProjectToLocal(cloudProject, childrenMap)
      } else if (hasPendingProjectChanges) {
        mergedProject = { ...localProject }
        mergedProject.tasks = this.mergeProjectTasks(localProject, cloudProject, childrenMap, pendingEntityIds)
      } else {
        mergedProject = this.mergeProject(localProject, cloudProject, childrenMap, pendingEntityIds)
      }

      mergedProjects.push(mergedProject)
    }

    for (const localProject of localProjects) {
      if (!cloudProjectMap.has(localProject.id)) {
        if (pendingEntityIds.has(`project:${localProject.id}`)) {
          mergedProjects.push({ ...localProject })
        }
      }
    }

    fillMissingPositionsForProjects(mergedProjects)
    useAppStore.setState({ projects: mergedProjects })
  }

  private convertCloudProjectToLocal(
    cloudProject: DatabaseProject,
    childrenMap: Map<string | undefined, DatabaseTask[]>
  ): ProjectData {
    const rootTasks = (childrenMap.get(undefined) || [])
      .filter(task => task.project_id === cloudProject.id)
      .map(task => this.convertTaskToLocal(task, childrenMap))

    return {
      id: cloudProject.id,
      name: cloudProject.name,
      lastModificationDate: cloudProject.updated_at,
      position: cloudProject.position,
      tasks: rootTasks,
    }
  }

  private convertTaskToLocal(
    cloudTask: DatabaseTask,
    childrenMap: Map<string | undefined, DatabaseTask[]>
  ): TaskData {
    const subtasks = (childrenMap.get(cloudTask.id) || [])
      .map(task => this.convertTaskToLocal(task, childrenMap))

    return {
      id: cloudTask.id,
      name: cloudTask.name,
      description: cloudTask.description || undefined,
      completed: cloudTask.completed,
      completionDate: cloudTask.completion_date || undefined,
      dueDate: cloudTask.due_date || undefined,
      lastModificationDate: cloudTask.updated_at,
      position: cloudTask.position,
      priority: cloudTask.priority,
      isOrdered: cloudTask.is_ordered || undefined,
      subtasks,
    }
  }

  private mergeProject(
    localProject: ProjectData,
    cloudProject: DatabaseProject,
    childrenMap: Map<string | undefined, DatabaseTask[]>,
    pendingEntityIds: Set<string>
  ): ProjectData {
    const cloudUpdateDate = cloudProject.updated_at
    const useCloudProject = cloudUpdateDate > localProject.lastModificationDate

    return {
      id: cloudProject.id,
      name: useCloudProject ? cloudProject.name : localProject.name,
      lastModificationDate: useCloudProject ? cloudUpdateDate : localProject.lastModificationDate,
      position: useCloudProject ? cloudProject.position : localProject.position,
      tasks: this.mergeProjectTasks(localProject, cloudProject, childrenMap, pendingEntityIds)
    }
  }

  private mergeProjectTasks(
    localProject: ProjectData,
    cloudProject: DatabaseProject,
    childrenMap: Map<string | undefined, DatabaseTask[]>,
    pendingEntityIds: Set<string>
  ): TaskData[] {
    const cloudTasks = (childrenMap.get(undefined) || []).filter(t => t.project_id === cloudProject.id)
    const localTaskMap = new Map(localProject.tasks.map(t => [t.id, t]))
    const cloudTaskMap = new Map(cloudTasks.map(t => [t.id, t]))

    const mergedTasks: TaskData[] = []

    for (const cloudTask of cloudTasks) {
      const localTask = localTaskMap.get(cloudTask.id)
      mergedTasks.push(this.mergeTask(localTask, cloudTask, childrenMap, pendingEntityIds))
    }

    for (const localTask of localProject.tasks) {
      if (!cloudTaskMap.has(localTask.id)) {
        if (pendingEntityIds.has(`task:${localTask.id}`)) {
          mergedTasks.push({ ...localTask })
        }
      }
    }

    return mergedTasks
  }

  private mergeTask(
    localTask: TaskData | undefined,
    cloudTask: DatabaseTask,
    childrenMap: Map<string | undefined, DatabaseTask[]>,
    pendingEntityIds: Set<string>
  ): TaskData {
    const hasPendingChanges = pendingEntityIds.has(`task:${cloudTask.id}`)

    if (!localTask) {
      return this.convertTaskToLocal(cloudTask, childrenMap)
    }

    if (hasPendingChanges) {
      return {
        ...localTask,
        subtasks: this.mergeTaskSubtasks(localTask, cloudTask, childrenMap, pendingEntityIds)
      }
    }

    const cloudUpdateDate = cloudTask.updated_at
    const useCloudTask = cloudUpdateDate > localTask.lastModificationDate

    return {
      id: cloudTask.id,
      name: useCloudTask ? cloudTask.name : localTask.name,
      description: useCloudTask ? (cloudTask.description || undefined) : localTask.description,
      completed: useCloudTask ? cloudTask.completed : localTask.completed,
      completionDate: useCloudTask ? (cloudTask.completion_date || undefined) : localTask.completionDate,
      dueDate: useCloudTask ? (cloudTask.due_date || undefined) : localTask.dueDate,
      lastModificationDate: useCloudTask ? cloudUpdateDate : localTask.lastModificationDate,
      position: useCloudTask ? cloudTask.position : localTask.position,
      priority: useCloudTask ? cloudTask.priority : localTask.priority,
      isOrdered: useCloudTask ? (cloudTask.is_ordered || undefined) : localTask.isOrdered,
      subtasks: this.mergeTaskSubtasks(localTask, cloudTask, childrenMap, pendingEntityIds)
    }
  }

  private mergeTaskSubtasks(
    localTask: TaskData,
    cloudTask: DatabaseTask,
    childrenMap: Map<string | undefined, DatabaseTask[]>,
    pendingEntityIds: Set<string>
  ): TaskData[] {
    const cloudSubtasks = childrenMap.get(cloudTask.id) || []
    const localSubtaskMap = new Map((localTask.subtasks || []).map(t => [t.id, t]))
    const cloudSubtaskMap = new Map(cloudSubtasks.map(t => [t.id, t]))

    const mergedSubtasks: TaskData[] = []

    for (const cloudSubtask of cloudSubtasks) {
      const localSubtask = localSubtaskMap.get(cloudSubtask.id)
      mergedSubtasks.push(this.mergeTask(localSubtask, cloudSubtask, childrenMap, pendingEntityIds))
    }

    for (const localSubtask of (localTask.subtasks || [])) {
      if (!cloudSubtaskMap.has(localSubtask.id)) {
        if (pendingEntityIds.has(`task:${localSubtask.id}`)) {
          mergedSubtasks.push({ ...localSubtask })
        }
      }
    }

    return mergedSubtasks
  }
}

// Global merge manager instance
export const mergeManager = new MergeManager() 