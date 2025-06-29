import type { TaskItemData, ProjectData } from "./types"

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
export const findTaskRecursive = (tasks: TaskItemData[], path: string[]): TaskItemData | null => {
  if (!path.length) return null
  const currentId = path[0]
  const task = tasks.find((t) => t.id === currentId)
  if (!task) return null
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
    subtask.completionDate = new Date()
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
 * Get ALL leaf nodes of a task at a certain unified path (includes project ID)
 */
export const getHierarchicalLeafNodes = (projects: ProjectData[], fullPath: string[]): TaskItemData[] => {
  if (isProjectList(fullPath)) return []
  
  // Make sure the project exists
  const project = projects.find(p => p.id === getProjectId(fullPath))
  if (!project) return [] // Project not found
  
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
  const taskPath = fullPath.slice(1)
  let currentPath = [...taskPath]
  while (true) {
    let currentTasks: TaskItemData[]
    if (currentPath.length === 0) {
      currentTasks = project.tasks
    } else {
      const parentTask = findTaskRecursive(project.tasks, currentPath)
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
    const parentTask = findTaskRecursive(project.tasks, currentPath)
    if (parentTask && !parentTask.completed) {
      // The parent task becomes the leaf
      return [parentTask]
    }

    // Parent is completed or doesn't exist, go up one level
    currentPath = currentPath.slice(0, -1)
  }
}

/**
 * Find a task by unified path (includes projectId)
 */
export const findTaskAtPath = (projects: ProjectData[], taskPath: string[]): TaskItemData | null => {
  if (taskPath.length <= 1) return null // Project level or invalid
  
  const project = projects.find(p => p.id === taskPath[0])
  if (!project) return null
  
  return findTaskRecursive(project.tasks, taskPath.slice(1))
}

/**
 * Find a project by unified path
 */
export const findProjectAtPath = (projects: ProjectData[], taskPath: string[]): ProjectData | null => {
  if (taskPath.length === 0) return null
  return projects.find(p => p.id === taskPath[0]) || null
}

/**
 * Update a task by unified path
 */
export const updateTaskAtPath = (projects: ProjectData[], taskPath: string[], updateFn: (task: TaskItemData) => void): boolean => {
  if (taskPath.length <= 1) return false
  
  const project = projects.find(p => p.id === taskPath[0])
  if (!project) return false
  
  return findAndUpdateTask(project.tasks, taskPath.slice(1), updateFn)
}

/**
 * Delete by unified path (can delete project or task)
 */
export const deleteAtPath = (projects: ProjectData[], taskPath: string[]): boolean => {
  if (taskPath.length === 0) return false
  
  if (taskPath.length === 1) {
    // Delete project
    const projectIndex = projects.findIndex(p => p.id === taskPath[0])
    if (projectIndex !== -1) {
      projects.splice(projectIndex, 1)
      return true
    }
    return false
  }
  
  // Delete task
  const project = projects.find(p => p.id === taskPath[0])
  if (!project) return false
  
  return deleteTaskFromArray(project.tasks, taskPath.slice(1))
}

/**
 * Add a task to parent by unified path
 */
export const addTaskToParent = (projects: ProjectData[], parentPath: string[], taskData: TaskItemData): TaskItemData | null => {
  if (parentPath.length === 0) return null
  
  const project = projects.find(p => p.id === parentPath[0])
  if (!project) return null
  
  if (parentPath.length === 1) {
    // Add to project root
    project.tasks.push(taskData)
  } else {
    // Add to parent task
    const parentTask = findTaskRecursive(project.tasks, parentPath.slice(1))
    if (!parentTask) return null
    parentTask.subtasks.push(taskData)
  }
  
  return taskData
}

// Helper functions for unified paths
export const getProjectId = (taskPath: string[]): string | null => {
  if (taskPath.length === 0) return null
  return taskPath[0] || null
}
export const isProject = (taskPath: string[]): boolean => taskPath.length === 1
export const isProjectList = (taskPath: string[]): boolean => taskPath.length === 0 