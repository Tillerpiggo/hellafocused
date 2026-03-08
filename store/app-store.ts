import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProjectData, TaskData } from "@/lib/types"
import { initialProjectsData } from "@/lib/mock-data"
import { produce } from "immer"
import { triggerConfetti } from "@/lib/confetti"
import { v4 as uuidv4 } from "uuid"
import {
  markAllSubtasksCompleted,
  findTaskAtPath,
  findProjectAtPath,
  updateTaskAtPath,
  deleteAtPath,
  addTaskToParent,
  isProject,
  isProjectList,
  isTaskDescendantOf,
  fillMissingPositionsForProjects,
  fillMissingPrioritiesForProjects,
  fillMissingProjectPositions,
  reorderProjects,
  toggleTaskDefer,
  toggleTaskPrefer,
  setTaskPriority,
  moveTaskWithPriorityChange,
  moveTaskToNewParent,
  getValidDropTargets,
  getPathDisplayName,
} from "@/lib/task-utils"
import { 
  trackProjectCreated, 
  trackProjectUpdated, 
  trackProjectDeleted,
  trackTaskCreated,
  trackTaskUpdated,
  trackTaskDeleted
} from "@/lib/sync-bridge"

interface AppState {
  projects: ProjectData[]
  currentPath: string[] // [] for project list, [projectId] for project, [projectId, taskId, ...] for tasks
  navigationContext: string[] // Stores the deepest path visited for breadcrumb context
  showCompleted: boolean
  searchQuery: string
  // Actions
  selectProject: (projectId: string | null) => void
  navigateToTask: (taskId: string) => void
  navigateToPath: (path: string[]) => void // Navigate directly to a specific path
  navigateBack: () => void // Navigates one level up in task hierarchy or to project list

  toggleTaskCompletion: (taskPath: string[]) => void
  toggleTaskDefer: (taskPath: string[]) => void
  toggleTaskPrefer: (taskPath: string[]) => void
  setTaskPriority: (taskPath: string[], priority: number) => void
  moveTaskWithPriorityChange: (taskPath: string[], globalSourceIndex: number, globalDestinationIndex: number, newPriority: number) => void
  deleteAtPath: (itemPath: string[]) => void

  toggleShowCompleted: () => void
  setSearchQuery: (query: string) => void

  addSubtaskToParent: (parentPath: string[], subtaskName: string) => void
  updateProjectName: (projectId: string, newName: string) => void
  updateTaskName: (taskPath: string[], newName: string) => void
  updateTaskDescription: (taskPath: string[], newDescription: string) => void
  setTaskDueDate: (taskPath: string[], dueDate: string | undefined) => void
  toggleTaskOrdered: (taskPath: string[]) => void
  dueSoonDays: number
  setDueSoonDays: (days: number) => void
  addProject: (projectName: string) => void
  reorderTasks: (parentPath: string[], fromIndex: number, toIndex: number) => void
  reorderProjects: (fromIndex: number, toIndex: number) => void
  moveTaskToNewParent: (taskPath: string[], newParentPath: string[], newPosition?: number) => void
  getValidDropTargets: (taskPath: string[]) => string[][]
  clearLocalState: () => void
}



export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: initialProjectsData,
      currentPath: [], // Start at project list
      navigationContext: [], // Start with empty context
      showCompleted: false,
      searchQuery: "",
      dueSoonDays: 3,

  selectProject: (projectId) => set({ 
    currentPath: projectId ? [projectId] : [],
    navigationContext: projectId ? [projectId] : [] // Reset context when selecting project
  }),

  navigateToTask: (taskId) => set((state) => {
    const newPath = [...state.currentPath, taskId]
    return { 
      currentPath: newPath,
      navigationContext: newPath // Going deeper, update context
    }
  }),

  navigateToPath: (path) => set((state) => {
    let newContext = state.navigationContext
    
    if (isProjectList(path)) {
      newContext = [] // Project list - reset
    } else if (isProject(path)) {
      newContext = path // Project level - reset to project
    } else if (state.navigationContext.length > 0 && path[0] !== state.navigationContext[0]) {
      newContext = path // Different project - reset
    } else if (isTaskDescendantOf(state.navigationContext, path)) {
      // Moving up same branch - keep context
    } else {
      newContext = path // Branch switch or going deeper
    }
    
    return { 
      currentPath: path,
      navigationContext: newContext
    }
  }),

  navigateBack: () =>
    set((state) => {
      if (isProjectList(state.currentPath)) {
        return { currentPath: [] }
      }
      return { currentPath: state.currentPath.slice(0, -1) }
    }),

  toggleTaskCompletion: (taskPath) => {
    const task = findTaskAtPath(get().projects, taskPath)
    if (!task) {
      return
    }

    // Trigger confetti for task completion (only when completing, not uncompleting)
    if (!task.completed) {
      triggerConfetti()
    }

    // Proceed with completion
    set(
      produce((draft: AppState) => {
        updateTaskAtPath(draft.projects, taskPath, (task) => {
          task.completed = !task.completed
          task.lastModificationDate = new Date().toISOString()

          // If completing a task, mark all subtasks as completed too and set completion date
          if (task.completed) {
            task.completionDate = new Date().toISOString()
            markAllSubtasksCompleted(task)
            // DO NOT automatically change showCompleted state here
          } else {
            // If uncompleting, remove completion date
            delete task.completionDate
          }
        })
      }),
    )

    trackTaskUpdated(taskPath)
  },

  toggleTaskDefer: (taskPath) => {
    let affectedTaskPaths: string[][] = []
    
    set(
      produce((draft: AppState) => {
        affectedTaskPaths = toggleTaskDefer(draft.projects, taskPath)
      }),
    )
    
    trackTaskUpdated(taskPath)
    // Track position updates for affected tasks
    affectedTaskPaths.forEach(affectedTaskPath => {
      trackTaskUpdated(affectedTaskPath)
    })
  },

  toggleTaskPrefer: (taskPath) => {
    let affectedTaskPaths: string[][] = []
    
    set(
      produce((draft: AppState) => {
        affectedTaskPaths = toggleTaskPrefer(draft.projects, taskPath)
      }),
    )
    
    trackTaskUpdated(taskPath)
    // Track position updates for affected tasks
    affectedTaskPaths.forEach(affectedTaskPath => {
      trackTaskUpdated(affectedTaskPath)
    })
  },

  setTaskPriority: (taskPath, priority) => {
    set(
      produce((draft: AppState) => {
        setTaskPriority(draft.projects, taskPath, priority)
      }),
    )
    trackTaskUpdated(taskPath)
  },

  moveTaskWithPriorityChange: (taskPath, globalSourceIndex, globalDestinationIndex, newPriority) => {
    set(
      produce((draft: AppState) => {
        moveTaskWithPriorityChange(draft.projects, taskPath, globalSourceIndex, globalDestinationIndex, newPriority)
      }),
    )
    trackTaskUpdated(taskPath)
  },

  deleteAtPath: (itemPath) => {
    let affectedTaskPaths: string[][] = []
    
    set(
      produce((draft: AppState) => {
        affectedTaskPaths = deleteAtPath(draft.projects, itemPath)

        // If the current path is no longer valid, navigate up appropriately
        if (!findTaskAtPath(draft.projects, draft.currentPath) && !findProjectAtPath(draft.projects, draft.currentPath)) {
          draft.currentPath = draft.currentPath.slice(0, -1)
        }
      }),
    )

    // Track deletion and position updates for sync
    if (isProject(itemPath)) {
      // Deleting a project
      trackProjectDeleted(itemPath[0])
    } else {
      // Deleting a task
      trackTaskDeleted(itemPath)
      
      // Track position updates for affected sibling tasks
      affectedTaskPaths.forEach(affectedTaskPath => {
        trackTaskUpdated(affectedTaskPath)
      })
    }
  },

  toggleShowCompleted: () => set((state) => ({ showCompleted: !state.showCompleted })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  addSubtaskToParent: (parentPath, subtaskName) => {

    set(
      produce((draft: AppState) => {
        if (parentPath.length === 0) {
          return // Can't add to empty path
        }

        const project = draft.projects.find((p) => p.id === parentPath[0])
        if (!project) {
          return
        }

        // Calculate position based on current number of tasks at this level
        let position: number
        if (parentPath.length === 1) {
          // Adding to project root
          position = project.tasks.length
        } else {
          // Adding to parent task
          const parentTask = findTaskAtPath(draft.projects, parentPath)
          position = parentTask ? parentTask.subtasks.length : 0
        }

        const newTaskId = uuidv4()
        const newTask: TaskData = {
          id: newTaskId,
          name: subtaskName,
          completed: false,
          lastModificationDate: new Date().toISOString(),
          position: position,
          priority: 0,
          subtasks: [],
        }


        // If parentPath is project level, add to project root
        if (parentPath.length === 1) {
          project.tasks.push(newTask)
        } else {
          addTaskToParent(draft.projects, parentPath, newTask)
        }
      }),
    )

    trackTaskCreated(parentPath)
  },

  updateProjectName: (projectId, newName) => {    

    set(
      produce((draft: AppState) => {
        const project = draft.projects.find((p) => p.id === projectId)
        if (project) {
          const oldName = project.name
          project.name = newName
          project.lastModificationDate = new Date().toISOString()
        } else {
        }
      }),
    )

    trackProjectUpdated(projectId)
  },

  updateTaskName: (taskPath, newName) => {

    set(
      produce((draft: AppState) => {
        updateTaskAtPath(draft.projects, taskPath, (task) => {
          const oldName = task.name
          task.name = newName
          task.lastModificationDate = new Date().toISOString()
        })
      }),
    )

    trackTaskUpdated(taskPath)
  },

  updateTaskDescription: (taskPath, newDescription) => {
    set(
      produce((draft: AppState) => {
        updateTaskAtPath(draft.projects, taskPath, (task) => {
          task.description = newDescription || undefined
          task.lastModificationDate = new Date().toISOString()
        })
      }),
    )

    trackTaskUpdated(taskPath)
  },

  setTaskDueDate: (taskPath, dueDate) => {
    set(
      produce((draft: AppState) => {
        updateTaskAtPath(draft.projects, taskPath, (task) => {
          task.dueDate = dueDate || undefined
          task.lastModificationDate = new Date().toISOString()
        })
      }),
    )

    trackTaskUpdated(taskPath)
  },

  toggleTaskOrdered: (taskPath) => {
    set(
      produce((draft: AppState) => {
        updateTaskAtPath(draft.projects, taskPath, (task) => {
          task.isOrdered = !task.isOrdered
          task.lastModificationDate = new Date().toISOString()
        })
      }),
    )
    trackTaskUpdated(taskPath)
  },

  setDueSoonDays: (days) => {
    set({ dueSoonDays: days })
  },

  addProject: (projectName) => {
    
    const newProjectId = uuidv4()
    
    set(
      produce((draft: AppState) => {
        // Calculate position at end of project list (clean 0-indexed approach)
        const newPosition = draft.projects.length

        const newProject: ProjectData = {
          id: newProjectId,
          name: projectName,
          lastModificationDate: new Date().toISOString(),
          position: newPosition,
          tasks: [],
        }

        draft.projects.push(newProject)
      }),
    )
  
    trackProjectCreated(newProjectId)
  },

  reorderTasks: (parentPath, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return


    // Store task IDs for sync tracking after state update
    let updatedTaskIds: string[] = []

    set(
      produce((draft: AppState) => {
        // Get the tasks at the parent level
        let tasks: TaskData[]
        if (parentPath.length === 0) {
          return // Can't reorder at project list level
        } else if (parentPath.length === 1) {
          // Reordering tasks in a project
          const project = draft.projects.find((p) => p.id === parentPath[0])
          if (!project) return
          tasks = project.tasks
        } else {
          // Reordering subtasks in a task
          const parentTask = findTaskAtPath(draft.projects, parentPath)
          if (!parentTask) return
          tasks = parentTask.subtasks
        }

        // Only reorder incomplete tasks (since that's what's displayed)
        // Sort by priority+position to match what's displayed in TaskListView
        const incompleteTasks = tasks
          .filter(task => !task.completed)
          .sort((a, b) => {
            // First sort by priority (descending: preferred=1 first, then normal=0, then deferred=-1) 
            if (a.priority !== b.priority) {
              return b.priority - a.priority
            }
            // Within same priority group, sort by position
            if (a.position !== undefined && b.position !== undefined) {
              return a.position - b.position
            }
            if (a.position !== undefined && b.position === undefined) return -1
            if (a.position === undefined && b.position !== undefined) return 1
            return a.lastModificationDate.localeCompare(b.lastModificationDate)
          })
        
        if (fromIndex >= incompleteTasks.length || toIndex >= incompleteTasks.length) return

        const movedTask = incompleteTasks[fromIndex]
        const targetTask = incompleteTasks[toIndex]
        
        // Only allow reordering within the same priority group
        if (movedTask.priority !== targetTask.priority) {
          return // Prevent cross-priority dragging
        }

        // Remove the task from the old position and insert at new position
        incompleteTasks.splice(fromIndex, 1)
        incompleteTasks.splice(toIndex, 0, movedTask)

        // Use visual array to assign clean 0-indexed positions within each priority section
        let preferredPosition = 0
        let normalPosition = 0
        let deferredPosition = 0
        
        incompleteTasks.forEach((task) => {
          if (task.priority === 1) {
            // Preferred priority section: 0,1,2,3...
            task.position = preferredPosition++
            task.lastModificationDate = new Date().toISOString()
            updatedTaskIds.push(task.id)
          } else if (task.priority === 0) {
            // Normal priority section: 0,1,2,3...
            task.position = normalPosition++
            task.lastModificationDate = new Date().toISOString()
            updatedTaskIds.push(task.id)
          } else if (task.priority === -1) {
            // Deferred priority section: 0,1,2,3...
            task.position = deferredPosition++
            task.lastModificationDate = new Date().toISOString()
            updatedTaskIds.push(task.id)
          }
        })


      }),
    )

    // Track each affected task for sync AFTER state update is committed
    updatedTaskIds.forEach(taskId => {
      const taskPath = [...parentPath, taskId]
      trackTaskUpdated(taskPath)
    })
  },

  reorderProjects: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return

    // Store project IDs for sync tracking after state update
    let updatedProjectIds: string[] = []

    set(
      produce((draft: AppState) => {
        updatedProjectIds = reorderProjects(draft.projects, fromIndex, toIndex)
      }),
    )

    // Track each affected project for sync AFTER state update is committed
    updatedProjectIds.forEach(projectId => {
      trackProjectUpdated(projectId)
    })
  },

  moveTaskToNewParent: (taskPath, newParentPath, newPosition) => {
    let result: { success: boolean; sourceAffectedTaskPaths: string[][]; destinationAffectedTaskPaths: string[][] } = { 
      success: false, 
      sourceAffectedTaskPaths: [], 
      destinationAffectedTaskPaths: [] 
    }
    
    set(
      produce((draft: AppState) => {
        result = moveTaskToNewParent(draft.projects, taskPath, newParentPath, newPosition)
      }),
    )

    if (result.success) {
      // Track position updates for affected tasks in source parent
      result.sourceAffectedTaskPaths.forEach(affectedTaskPath => {
        trackTaskUpdated(affectedTaskPath)
      })
      
      // Track position updates for affected tasks in destination parent
      // (The destinationAffectedTaskPaths already includes the moved task with its NEW path)
      result.destinationAffectedTaskPaths.forEach(affectedTaskPath => {
        trackTaskUpdated(affectedTaskPath)
      })
    }
  },

  getValidDropTargets: (taskPath) => {
    return getValidDropTargets(get().projects, taskPath)
  },

  clearLocalState: () => set({
    projects: initialProjectsData,
    currentPath: [],
    showCompleted: false,
    searchQuery: "",
  }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentPath: state.currentPath,
        showCompleted: state.showCompleted,
        searchQuery: state.searchQuery,
      }),
      onRehydrateStorage: () => (state) => {
        // Fill missing positions and priorities for any existing tasks when loading from storage
        if (state?.projects) {
          fillMissingProjectPositions(state.projects)
          fillMissingPositionsForProjects(state.projects)
          fillMissingPrioritiesForProjects(state.projects)
        }
      },
    }
  )
)

// Helper to get current tasks to display based on path
export const getCurrentTasksForView = (
  projects: ProjectData[],
  currentPath: string[],
  searchQuery: string,
  showCompleted: boolean
): TaskData[] => {
  if (isProjectList(currentPath)) return []

  const project = findProjectAtPath(projects, currentPath)
  if (!project) return []

  // Get tasks at the current path level
  let tasksToShow: TaskData[]
  if (isProject(currentPath)) {
    tasksToShow = project.tasks
  } else {
    const currentTask = findTaskAtPath(projects, currentPath)
    if (!currentTask) {
      return []
    }
    tasksToShow = currentTask.subtasks
  }

  // Helper function to sort tasks by priority first, then position, with fallback to creation date
  const sortByPriorityAndPosition = (tasks: TaskData[]) => {
    return tasks.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }

      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position
      }
      if (a.position !== undefined && b.position === undefined) return -1
      if (a.position === undefined && b.position !== undefined) return 1
      return a.lastModificationDate.localeCompare(b.lastModificationDate)
    })
  }

  // Check if the current parent task is ordered
  const currentTask = isProject(currentPath) ? null : findTaskAtPath(projects, currentPath)
  const parentIsOrdered = currentTask?.isOrdered

  if (searchQuery.trim()) {
    const searchLower = searchQuery.toLowerCase().trim()
    tasksToShow = tasksToShow.filter((task) =>
      task.name.toLowerCase().includes(searchLower)
    )
  }

  if (parentIsOrdered) {
    // Ordered parents: show all tasks in position order, completed tasks inline
    return sortByPriorityAndPosition(tasksToShow)
  }

  if (showCompleted) {
    const incompleteTasks = sortByPriorityAndPosition(tasksToShow.filter((task) => !task.completed))
    const completedTasks = tasksToShow
      .filter((task) => task.completed)
      .sort((a, b) => {
        const aTime = a.completionDate || ''
        const bTime = b.completionDate || ''
        return aTime.localeCompare(bTime)
      })

    return [...completedTasks, ...incompleteTasks]
  } else {
    return sortByPriorityAndPosition(tasksToShow.filter((task) => !task.completed))
  }
}

export const getCurrentTaskChain = (
  projects: ProjectData[],
  currentPath: string[]
): TaskData[] => {
  if (isProjectList(currentPath) || isProject(currentPath)) return []

  const project = findProjectAtPath(projects, currentPath)
  if (!project) return []

  const chain: TaskData[] = []
  let currentTasks = project.tasks
  const taskPath = currentPath.slice(1)
  for (const taskId of taskPath) {
    const task = currentTasks.find((t) => t.id === taskId)
    if (task) {
      chain.push(task)
      currentTasks = task.subtasks
    } else {
      break
    }
  }
  return chain
}

