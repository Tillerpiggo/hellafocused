import type { TaskData, ProjectData } from "./types"

/**
 * Find and update a task with a task path with a certain update function
 */
export const findAndUpdateTask = (tasks: TaskData[], path: string[], updateFn: (task: TaskData) => void): boolean => {
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
export const findTaskRecursive = (tasks: TaskData[], path: string[]): TaskData | null => {
  if (!path.length) return null
  const currentId = path[0]
  const task = tasks.find((t) => t.id === currentId)
  if (!task) return null
  if (path.length === 1) return task
  return findTaskRecursive(task.subtasks, path.slice(1))
}

/**
 * Delete a task from an array at a task path and update positions
 * Returns array of affected task paths that had their positions updated
 */
export const deleteTaskFromArray = (tasks: TaskData[], path: string[], fullPath: string[]): string[][] => {
  if (!path.length) return []

  if (path.length === 1) {
    const index = tasks.findIndex((t) => t.id === path[0])
    if (index !== -1) {
      const deletedTask = tasks[index]
      const deletedPosition = deletedTask.position ?? index
      
      tasks.splice(index, 1)
      
      // Only update tasks with position > deletedPosition
      const affectedTaskPaths: string[][] = []
              tasks.forEach((task) => {
        if (task.position !== undefined && task.position > deletedPosition) {
          task.position = task.position - 1
          task.lastModificationDate = new Date().toISOString()
          const parentPath = fullPath.slice(0, fullPath.length - path.length)
          affectedTaskPaths.push([...parentPath, task.id])
        }
      })
      
      return affectedTaskPaths
    }
    return []
  }

  const currentId = path[0]
  const task = tasks.find((t) => t.id === currentId)
  if (!task) return []

  return deleteTaskFromArray(task.subtasks, path.slice(1), fullPath)
}

/**
 * Count all total subtasks for a given task
 */
export const countSubtasksRecursively = (task: TaskData): number => {
  if (!task.subtasks || task.subtasks.length === 0) return 0
  return task.subtasks.length + task.subtasks.reduce((acc, subtask) => acc + countSubtasksRecursively(subtask), 0)
}

/**
 * Mark all subtasks as completed (recursively)
 */
export const markAllSubtasksCompleted = (task: TaskData) => {
  task.subtasks.forEach((subtask) => {
    subtask.completed = true
    subtask.completionDate = new Date().toISOString()
    subtask.lastModificationDate = new Date().toISOString()
    markAllSubtasksCompleted(subtask)
  })
}

/**
 * Fill in missing position values for tasks based on creation date/modification date
 */
export const fillMissingPositions = (tasks: TaskData[]): void => {
  // Sort tasks by creation date (lastModificationDate as proxy) to determine proper order
  const tasksWithMissingPositions = tasks.filter(task => task.position === undefined)
  
  if (tasksWithMissingPositions.length === 0) return
  
  // Sort by lastModificationDate to establish creation order
  tasksWithMissingPositions.sort((a, b) => a.lastModificationDate.localeCompare(b.lastModificationDate))
  
  // Find the highest existing position
  const maxPosition = Math.max(0, ...tasks.filter(task => task.position !== undefined).map(task => task.position!))
  
  // Assign positions starting from maxPosition + 1
  tasksWithMissingPositions.forEach((task, index) => {
    task.position = maxPosition + 1 + index
  })
  
  // Recursively fill positions for subtasks
  tasks.forEach(task => {
    if (task.subtasks && task.subtasks.length > 0) {
      fillMissingPositions(task.subtasks)
    }
  })
}

/**
 * Fill missing positions for all projects (fills task positions within each project)
 */
export const fillMissingPositionsForProjects = (projects: ProjectData[]): void => {
  projects.forEach(project => {
    fillMissingPositions(project.tasks)
  })
}

/**
 * Normalize ALL project positions to be 0-indexed and gap-free based on creation order
 */
export const fillMissingProjectPositions = (projects: ProjectData[]): void => {
  // Sort all projects by their position first, then by creation date for missing positions
  const sortedProjects = projects.slice().sort((a, b) => {
    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position
    }
    if (a.position !== undefined) return -1
    if (b.position !== undefined) return 1
    // Both undefined, sort by creation date
    return a.lastModificationDate.localeCompare(b.lastModificationDate)
  })
  
  // Reassign ALL positions to be 0-indexed and gap-free
  sortedProjects.forEach((project, index) => {
    project.position = index
  })
}

/**
 * Fill missing priority for tasks (default to 0 for normal priority)
 */
export const fillMissingPriorities = (tasks: TaskData[]): void => {
  tasks.forEach(task => {
    if (task.priority === undefined) {
      task.priority = 0 // Default to normal priority
    }
    if (task.subtasks && task.subtasks.length > 0) {
      fillMissingPriorities(task.subtasks)
    }
  })
}

/**
 * Fill missing priorities for all projects
 */
export const fillMissingPrioritiesForProjects = (projects: ProjectData[]): void => {
  projects.forEach(project => {
    fillMissingPriorities(project.tasks)
  })
}

/**
 * Toggle task defer status with pile-up behavior
 * 
 * POSITIONING SIDE EFFECTS:
 * - When deferring (priority = -1): Moves task to END of deferred group, ignores current position
 * - When undeferring (priority = 0): Moves task to END of normal group, ignores current position
 * - Always overwrites task.position based on group maximums
 * - Use setTaskPriority() for priority changes without positioning side effects
 * 
 * Deferred tasks go to position 0, normal tasks go to end of normal group
 */
export const toggleTaskDefer = (projects: ProjectData[], taskPath: string[]): string[][] => {
  const task = findTaskAtPath(projects, taskPath)
  if (!task) return []

  // Determine parent task array
  const parentPath = taskPath.slice(0, -1)
  let parentTasks: TaskData[]
  
  if (parentPath.length === 1) {
    // Top-level task in project
    const project = findProjectAtPath(projects, parentPath)
    if (!project) return []
    parentTasks = project.tasks
  } else {
    // Subtask
    const parentTask = findTaskAtPath(projects, parentPath)
    if (!parentTask) return []
    parentTasks = parentTask.subtasks
  }

  const isCurrentlyDeferred = task.priority === -1
  const newPriority = isCurrentlyDeferred ? 0 : -1
  const affectedTaskPaths: string[][] = []

  // Update task priority and timestamp
  task.priority = newPriority
  task.lastModificationDate = new Date().toISOString()

  if (newPriority === -1) {
    // Deferring: Move to end of deferred group and shift normal tasks up to fill gap
    const oldPosition = task.position ?? 0
    const normalTasks = parentTasks.filter(t => t.priority === 0)
    
    // Shift normal tasks that come after the deferred task up by 1
    normalTasks.forEach(t => {
      if (t.id !== task.id && t.position !== undefined && t.position > oldPosition) {
        t.position = t.position - 1
        t.lastModificationDate = new Date().toISOString()
        affectedTaskPaths.push([...parentPath, t.id])
      }
    })
    
    const deferredTasks = parentTasks.filter(t => t.priority === -1)
    const maxDeferredPosition = Math.max(-1, ...deferredTasks.map(t => t.position ?? -1))
    task.position = maxDeferredPosition + 1
  } else {
    // Undeferring: Move to end of normal priority tasks
    const normalTasks = parentTasks.filter(t => t.priority === 0)
    const maxNormalPosition = Math.max(0, ...normalTasks.map(t => t.position ?? 0))
    task.position = maxNormalPosition + 1
  }

  return affectedTaskPaths
}

/**
 * Toggle task prefer status with pile-up behavior
 * 
 * POSITIONING SIDE EFFECTS:
 * - When preferring (priority = 1): Moves task to END of preferred group, ignores current position
 * - When unpreferring (priority = 0): Moves task to START of normal group, ignores current position
 * - Always overwrites task.position based on group maximums
 * - Use setTaskPriority() for priority changes without positioning side effects
 * 
 * Preferred tasks go to end of preferred group, normal tasks go to position 0
 */
export const toggleTaskPrefer = (projects: ProjectData[], taskPath: string[]): string[][] => {
  const task = findTaskAtPath(projects, taskPath)
  if (!task) return []

  // Determine parent task array
  const parentPath = taskPath.slice(0, -1)
  let parentTasks: TaskData[]
  
  if (parentPath.length === 1) {
    // Top-level task in project
    const project = findProjectAtPath(projects, parentPath)
    if (!project) return []
    parentTasks = project.tasks
  } else {
    // Subtask
    const parentTask = findTaskAtPath(projects, parentPath)
    if (!parentTask) return []
    parentTasks = parentTask.subtasks
  }

  const isCurrentlyPreferred = task.priority === 1
  const newPriority = isCurrentlyPreferred ? 0 : 1
  const affectedTaskPaths: string[][] = []

  // Update task priority and timestamp
  task.priority = newPriority
  task.lastModificationDate = new Date().toISOString()

  if (newPriority === 1) {
    // Preferring: Move to end of preferred group (maintain original order)
    const preferredTasks = parentTasks.filter(t => t.priority === 1)
    const maxPreferredPosition = Math.max(-1, ...preferredTasks.map(t => t.position ?? -1))
    task.position = maxPreferredPosition + 1
  } else {
    // Unpreferring: Move to start of normal priority tasks (position 0, others shift)
    // Exclude the primary task to avoid sync conflicts - it's already synced separately
    const normalTasks = parentTasks.filter(t => t.priority === 0 && t.id !== task.id)
    
    // Shift all existing normal tasks down by 1
    normalTasks.forEach(t => {
      if (t.position !== undefined) {
        t.position = t.position + 1
        t.lastModificationDate = new Date().toISOString()
        affectedTaskPaths.push([...parentPath, t.id])
      }
    })
    task.position = 0
  }

  return affectedTaskPaths
}

/**
 * Move task with priority change in a single atomic operation
 * 
 * 4-step approach that preserves multi-0-indexing:
 * 1. Convert visual destination index to section-local position
 * 2. Remove from source section (fill position gaps)
 * 3. Insert into target section (make room at target position)
 * 4. Set moved task's new position and priority
 */
export const moveTaskWithPriorityChange = (
  projects: ProjectData[], 
  taskPath: string[], 
  globalSourceIndex: number,
  globalDestinationIndex: number,
  newPriority: number
): void => {
  const task = findTaskAtPath(projects, taskPath)
  if (!task) return

  // Get parent tasks array
  const parentPath = taskPath.slice(0, -1)
  let parentTasks: TaskData[]
  
  if (parentPath.length === 1) {
    const project = findProjectAtPath(projects, parentPath)
    if (!project) return
    parentTasks = project.tasks
  } else {
    const parentTask = findTaskAtPath(projects, parentPath)
    if (!parentTask) return
    parentTasks = parentTask.subtasks
  }

  // Step 1: Change priority FIRST
  task.priority = newPriority
  task.lastModificationDate = new Date().toISOString()

  // Step 2: NOW compute section counts with correct priorities
  const sortedTasks = parentTasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      if (a.position !== undefined && b.position !== undefined) return a.position - b.position
      return a.lastModificationDate.localeCompare(b.lastModificationDate)
    })
  
  // Step 3: Create visual array and perform the move
  const visualArray = sortedTasks.slice() // Copy the sorted visual array
  
  // Find current position of moved task in visual array
  const currentVisualIndex = visualArray.findIndex(t => t.id === task.id)
  
  // Remove task from current visual position
  if (currentVisualIndex !== -1) {
    visualArray.splice(currentVisualIndex, 1)
  }
  
  // Insert task at target visual position
  visualArray.splice(globalDestinationIndex, 0, task)
  
  // Step 5: Reassign all positions based on final visual array order
  let preferredPosition = 0
  let normalPosition = 0
  let deferredPosition = 0
  
  visualArray.forEach((t) => {
    if (t.priority === 1) {
      t.position = preferredPosition++
      t.lastModificationDate = new Date().toISOString()
    } else if (t.priority === 0) {
      t.position = normalPosition++
      t.lastModificationDate = new Date().toISOString()
    } else if (t.priority === -1) {
      t.position = deferredPosition++
      t.lastModificationDate = new Date().toISOString()
    }
  })
}

/**
 * Set task priority without positioning side effects
 * 
 * Unlike toggleTaskDefer(), this method only changes the priority value
 * and does NOT modify the task's position. Use this when you want to
 * control positioning separately (e.g., during drag operations).
 */
export const setTaskPriority = (projects: ProjectData[], taskPath: string[], newPriority: number): void => {
  const task = findTaskAtPath(projects, taskPath)
  if (!task) return

  // Only update priority and timestamp, preserve position
  task.priority = newPriority
  task.lastModificationDate = new Date().toISOString()
}

/**
 * Find the path to a specific task by task id
 */
export const findTaskPath = (tasks: TaskData[], targetId: string, currentPath: string[] = []): string[] | null => {
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
export const getHierarchicalLeafNodes = (projects: ProjectData[], fullPath: string[]): TaskData[] => {
  if (isProjectList(fullPath)) return []
  
  // Make sure the project exists
  const project = projects.find(p => p.id === getProjectId(fullPath))
  if (!project) return [] // Project not found
  
  // Get all leaf nodes from the tasks at this level (recursively)
  const getLeafNodesAtLevel = (tasksAtLevel: TaskData[]): TaskData[] => {
    let leaves: TaskData[] = []
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
    let currentTasks: TaskData[]
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
export const findTaskAtPath = (projects: ProjectData[], taskPath: string[]): TaskData | null => {
  if (!isTask(taskPath)) return null // Project level or invalid
  
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
export const updateTaskAtPath = (projects: ProjectData[], taskPath: string[], updateFn: (task: TaskData) => void): boolean => {
  if (taskPath.length <= 1) return false
  
  const project = projects.find(p => p.id === taskPath[0])
  if (!project) return false
  
  return findAndUpdateTask(project.tasks, taskPath.slice(1), updateFn)
}

/**
 * Delete by unified path (can delete project or task) and update positions
 * Returns array of affected task paths that had their positions updated
 */
export const deleteAtPath = (projects: ProjectData[], taskPath: string[]): string[][] => {
  if (isProjectList(taskPath)) return []
  
  if (isProject(taskPath)) {
    // Delete project - no position updates needed
    const projectIndex = projects.findIndex(p => p.id === taskPath[0])
    if (projectIndex !== -1) {
      projects.splice(projectIndex, 1)
      return []
    }
    return []
  }
  else if (isTask(taskPath)) {
    // Delete task and update positions
    const project = projects.find(p => p.id === taskPath[0])
    if (!project) return []
    
    return deleteTaskFromArray(project.tasks, taskPath.slice(1), taskPath)
  }
  return []
}

/**
 * Add a task to parent by unified path
 */
export const addTaskToParent = (projects: ProjectData[], parentPath: string[], taskData: TaskData): TaskData | null => {
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



/**
 * Insert a task into a new parent at a specific position
 * Returns array of affected task paths that had their positions updated
 */
export const insertTaskIntoNewParent = (projects: ProjectData[], newParentPath: string[], task: TaskData, position?: number): string[][] => {
  if (newParentPath.length === 0) return []
  
  const project = projects.find(p => p.id === newParentPath[0])
  if (!project) return []
  
  let targetTasks: TaskData[]
  if (newParentPath.length === 1) {
    // Inserting at project root level
    targetTasks = project.tasks
  } else {
    // Inserting into a subtask
    const parentTask = findTaskRecursive(project.tasks, newParentPath.slice(1))
    if (!parentTask) return []
    targetTasks = parentTask.subtasks
  }
  
  // Update task's modification date
  task.lastModificationDate = new Date().toISOString()
  
  // Insert at specified position or at the end
  const insertPosition = position !== undefined ? Math.min(position, targetTasks.length) : targetTasks.length
  
  // First update positions of existing tasks that will be shifted (position >= insertPosition)
  const affectedTaskPaths: string[][] = []
  targetTasks.forEach((t) => {
    if (t.position !== undefined && t.position >= insertPosition) {
      t.position = t.position + 1
      t.lastModificationDate = new Date().toISOString()
      affectedTaskPaths.push([...newParentPath, t.id])
    }
  })
  
  // Set position for the new task
  task.position = insertPosition
  
  // Insert the task
  targetTasks.splice(insertPosition, 0, task)
  
  // Add the inserted task to affected paths
  affectedTaskPaths.push([...newParentPath, task.id])
  
  return affectedTaskPaths
}

/**
 * Move a task (and all its subtasks) from one parent to another
 * Returns object with success status and arrays of affected task paths for sync
 */
export const moveTaskToNewParent = (projects: ProjectData[], taskPath: string[], newParentPath: string[], newPosition?: number): {
  success: boolean
  sourceAffectedTaskPaths: string[][]
  destinationAffectedTaskPaths: string[][]
} => {
  // Validate paths
  if (taskPath.length <= 1 || newParentPath.length === 0) {
    return { success: false, sourceAffectedTaskPaths: [], destinationAffectedTaskPaths: [] }
  }
  
  // Don't allow moving a task into itself or its own subtasks
  if (isTaskDescendantOf(newParentPath, taskPath)) {
    return { success: false, sourceAffectedTaskPaths: [], destinationAffectedTaskPaths: [] }
  }
  
  // Don't allow moving to the same parent (use reorderTasks for that)
  const currentParentPath = taskPath.slice(0, -1)
  if (arePathsEqual(currentParentPath, newParentPath)) {
    return { success: false, sourceAffectedTaskPaths: [], destinationAffectedTaskPaths: [] }
  }
  
  // Get the task to move first
  const task = findTaskAtPath(projects, taskPath)
  if (!task) {
    return { success: false, sourceAffectedTaskPaths: [], destinationAffectedTaskPaths: [] }
  }
  
  // Remove task from current parent (this also updates positions)
  const sourceAffectedTaskPaths = deleteAtPath(projects, taskPath)
  
  // Insert task into new parent
  const destinationAffectedTaskPaths = insertTaskIntoNewParent(projects, newParentPath, task, newPosition)
  
  return {
    success: destinationAffectedTaskPaths.length > 0,
    sourceAffectedTaskPaths,
    destinationAffectedTaskPaths
  }
}

/**
 * Check if a task path is a descendant of another path
 * Used to prevent dropping a task into its own subtasks
 */
export const isTaskDescendantOf = (taskPath: string[], ancestorPath: string[]): boolean => {
  if (ancestorPath.length >= taskPath.length) return false
  
  for (let i = 0; i < ancestorPath.length; i++) {
    if (taskPath[i] !== ancestorPath[i]) return false
  }
  
  return true
}

/**
 * Check if two paths are equal
 */
export const arePathsEqual = (path1: string[], path2: string[]): boolean => {
  if (path1.length !== path2.length) return false
  return path1.every((segment, index) => segment === path2[index])
}

/**
 * Get all valid drop targets for a given task
 * Returns array of paths where the task can be dropped
 */
export const getValidDropTargets = (projects: ProjectData[], taskPath: string[]): string[][] => {
  const validTargets: string[][] = []
  
  // Add project roots as valid targets
  projects.forEach(project => {
    validTargets.push([project.id])
  })
  
  // Add all tasks as valid targets (except the task itself and its descendants)
  const addTaskTargets = (tasks: TaskData[], currentPath: string[]) => {
    tasks.forEach(task => {
      const taskTargetPath = [...currentPath, task.id]
      
      // Don't allow dropping into the task itself or its descendants
      if (!arePathsEqual(taskTargetPath, taskPath) && !isTaskDescendantOf(taskTargetPath, taskPath)) {
        validTargets.push(taskTargetPath)
        
        // Recursively add subtasks as targets
        if (task.subtasks.length > 0) {
          addTaskTargets(task.subtasks, taskTargetPath)
        }
      }
    })
  }
  
  projects.forEach(project => {
    addTaskTargets(project.tasks, [project.id])
  })
  
  return validTargets
}

/**
 * Reorder projects by moving a project from one position to another
 * Returns array of affected project IDs that had their positions updated
 */
export const reorderProjects = (projects: ProjectData[], fromIndex: number, toIndex: number): string[] => {
  if (fromIndex === toIndex) return []
  
  // Sort projects by position to match visual order
  const sortedProjects = projects
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  
  // Get the project being moved
  const movedProject = sortedProjects[fromIndex]
  if (!movedProject) return []
  
  // Remove project from current position
  sortedProjects.splice(fromIndex, 1)
  
  // Insert project at new position
  sortedProjects.splice(toIndex, 0, movedProject)
  
  // ALWAYS reassign ALL positions to ensure 0-indexed, gap-free ordering
  const updatedProjectIds: string[] = []
  sortedProjects.forEach((project, index) => {
    project.position = index
    project.lastModificationDate = new Date().toISOString()
    updatedProjectIds.push(project.id)
  })
  
  return updatedProjectIds
}

/**
 * Get the display name for a path (for debugging/UI purposes)
 */
export const getPathDisplayName = (projects: ProjectData[], path: string[]): string => {
  if (path.length === 0) return "Project List"
  
  const project = projects.find(p => p.id === path[0])
  if (!project) return "Unknown Project"
  
  if (path.length === 1) return project.name
  
  const task = findTaskAtPath(projects, path)
  return task ? task.name : "Unknown Task"
}

// Helper functions for unified paths
export const getProjectId = (taskPath: string[]): string | null => {
  if (!taskPath || taskPath.length === 0) return null
  return taskPath[0] || null
}
export const isProject = (taskPath: string[]): boolean => taskPath && taskPath.length === 1
export const isTask = (taskPath: string[]): boolean => taskPath && taskPath.length > 1
export const isProjectList = (taskPath: string[]): boolean => !taskPath || taskPath.length === 0 