import type { ProjectData, TaskData } from './types'

/**
 * A serializable path through the task tree.
 *
 * The first segment is always a project id. Remaining segments are task ids.
 * An empty path represents the project list.
 */
export type TaskPath = string[]

export const TaskPath = {
  empty(): TaskPath {
    return []
  },

  from(...segments: string[]): TaskPath {
    return segments
  },

  append(path: TaskPath, segment: string): TaskPath {
    return [...path, segment]
  },

  parent(path: TaskPath): TaskPath {
    return path.slice(0, -1)
  },

  projectId(path: TaskPath): string | null {
    return path[0] ?? null
  },

  isProjectList(path: TaskPath): boolean {
    return path.length === 0
  },

  isProject(path: TaskPath): boolean {
    return path.length === 1
  },

  isTask(path: TaskPath): boolean {
    return path.length > 1
  },

  equals(left: TaskPath, right: TaskPath): boolean {
    return left.length === right.length && left.every((segment, index) => segment === right[index])
  },

  isPrefixOf(prefix: TaskPath, path: TaskPath): boolean {
    return prefix.length <= path.length && prefix.every((segment, index) => segment === path[index])
  },

  isDescendantOf(path: TaskPath, ancestor: TaskPath): boolean {
    return ancestor.length < path.length
      && ancestor.every((segment, index) => segment === path[index])
  },

  serialize(path: TaskPath): string {
    return path.join('/')
  },

  getSiblingTasks(projects: ProjectData[], path: TaskPath): TaskData[] {
    if (path.length <= 1) return []

    const project = projects.find(candidate => candidate.id === path[0])
    if (!project) return []

    let tasksAtLevel = project.tasks
    for (const parentId of path.slice(1, -1)) {
      const parent = tasksAtLevel.find(task => task.id === parentId)
      if (!parent) return []
      tasksAtLevel = parent.subtasks
    }

    const taskId = path.at(-1)
    return tasksAtLevel.filter(task => task.id !== taskId)
  },
}
