import type { TaskItemData } from "./types"

/**
 * Find and update a task with a task path with a certain update function
 */
export const findAndUpdateTask = (tasks: TaskItemData[], path: string[], updateFn: (task: TaskItemData) => void): boolean => {
  if (!path.length) return false
  const currentId = path[0]
  const task = tasks.find((t) => t.id === currentId)
  if (!task) return false

  if (path.length === 1) {
    updateFn(task)
    return true
  }
  return findAndUpdateTask(task.subtasks, path.slice(1), updateFn)
}

/**
 * Find a task with a task path
 */
export const findTaskRecursive = (tasks: TaskItemData[], path: string[]): TaskItemData | undefined => {
  if (!path.length) return undefined
  const currentId = path[0]
  const task = tasks.find((t) => t.id === currentId)
  if (!task) return undefined
  if (path.length === 1) return task
  return findTaskRecursive(task.subtasks, path.slice(1))
}

/**
 * Delete a task from an array at a task path
 */
export const deleteTaskFromArray = (tasks: TaskItemData[], path: string[]): boolean => {
  if (!path.length) return false

  if (path.length === 1) {
    const index = tasks.findIndex((t) => t.id === path[0])
    if (index !== -1) {
      tasks.splice(index, 1)
      return true
    }
    return false
  }

  const currentId = path[0]
  const task = tasks.find((t) => t.id === currentId)
  if (!task) return false

  return deleteTaskFromArray(task.subtasks, path.slice(1))
}

/**
 * Count all total subtasks for a given task
 */
export const countSubtasksRecursively = (task: TaskItemData): number => {
  if (!task.subtasks || task.subtasks.length === 0) return 0
  return task.subtasks.length + task.subtasks.reduce((acc, subtask) => acc + countSubtasksRecursively(subtask), 0)
}

/**
 * Mark all subtasks as completed (recursively)
 */
export const markAllSubtasksCompleted = (task: TaskItemData) => {
  task.subtasks.forEach((subtask) => {
    subtask.completed = true
    subtask.completedAt = new Date().toISOString()
    markAllSubtasksCompleted(subtask)
  })
}

/**
 * Find the path to a specific task by task id
 */
export const findTaskPath = (tasks: TaskItemData[], targetId: string, currentPath: string[] = []): string[] | null => {
  for (const task of tasks) {
    const newPath = [...currentPath, task.id]
    if (task.id === targetId) return newPath
    if (task.subtasks.length > 0) {
      const subPath = findTaskPath(task.subtasks, targetId, newPath)
      if (subPath) return subPath
    }
  }
  return null
}

/**
 * Get ALL leaf nodes of a task at a certain path
 */
export const getHierarchicalLeafNodes = (tasks: TaskItemData[], startPath: string[]): TaskItemData[] => {
  // Get all leaf nodes from the tasks at this level (recursively)
  const getLeafNodesAtLevel = (tasksAtLevel: TaskItemData[]): TaskItemData[] => {
    let leaves: TaskItemData[] = []
    for (const task of tasksAtLevel) {
      if (!task.completed) {
        if (!task.subtasks || task.subtasks.length === 0 || task.subtasks.every((st) => st.completed)) {
          leaves.push(task)
        } else {
          leaves = leaves.concat(getLeafNodesAtLevel(task.subtasks.filter((st) => !st.completed)))
        }
      }
    }
    return leaves
  }

  // Get all leaf nodes from the path. 
  // If there are no leaves, keep going up a level until there are leaves.
  let currentPath = [...startPath]
  while (true) {
    let currentTasks: TaskItemData[]
    if (currentPath.length === 0) {
      currentTasks = tasks
    } else {
      const parentTask = findTaskRecursive(tasks, currentPath)
      if (!parentTask) {
        return [] // Path is invalid
      }
      currentTasks = parentTask.subtasks
    }

    // Get leaf nodes at current level
    const leaves = getLeafNodesAtLevel(currentTasks)
    if (leaves.length > 0) {
      return leaves
    }
    if (currentPath.length === 0) {
      // We're at project level with no leaves, so return empty array
      return []
    }

    // Check if the parent task (the task we're inside) can be a leaf
    const parentTask = findTaskRecursive(tasks, currentPath)
    if (parentTask && !parentTask.completed) {
      // The parent task becomes the leaf
      return [parentTask]
    }

    // Parent is completed or doesn't exist, go up one level
    currentPath = currentPath.slice(0, -1)
  }
} 