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
      showCompleted: false,
      searchQuery: "",

  selectProject: (projectId) => set({ currentPath: projectId ? [projectId] : [] }),

  navigateToTask: (taskId) => set((state) => ({ currentPath: [...state.currentPath, taskId] })),

  navigateToPath: (path) => set({ currentPath: path }),

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

    console.log('=== reorderTasks DEBUG ===')
    console.log('fromIndex:', fromIndex, 'toIndex:', toIndex)

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
            // First sort by priority (descending: normal=0 first, then deferred=-1) 
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

        // Get the task being moved and check if reordering within same priority group
        console.log('=== ALL TASK POSITIONS BEFORE REORDER ===')
        tasks.forEach(t => {
          console.log(`${t.name}: priority=${t.priority}, position=${t.position}`)
        })
        console.log('==========================================')

        const movedTask = incompleteTasks[fromIndex]
        const targetTask = incompleteTasks[toIndex]
        
        console.log('Moving task:', movedTask.name, 'to position of:', targetTask.name)
        
        // Only allow reordering within the same priority group
        if (movedTask.priority !== targetTask.priority) {
          console.log('Cross-priority move blocked')
          return // Prevent cross-priority dragging
        }

        // Remove the task from the old position and insert at new position
        incompleteTasks.splice(fromIndex, 1)
        incompleteTasks.splice(toIndex, 0, movedTask)

        // NEW APPROACH: Use visual array to assign clean 0-indexed positions
        // Walk through the visual array and assign positions 0,1,2,3... within each priority section
        let normalPosition = 0
        let deferredPosition = 0
        
        console.log('Reassigning all positions based on visual array order:')
        incompleteTasks.forEach((task, visualIndex) => {
          if (task.priority === 0) {
            // Normal priority section: 0,1,2,3...
            console.log(`Setting ${task.name} (normal) position to ${normalPosition}`)
            task.position = normalPosition++
            task.lastModificationDate = new Date().toISOString()
            updatedTaskIds.push(task.id)
          } else if (task.priority === -1) {
            // Deferred priority section: reset to 0,1,2,3...
            console.log(`Setting ${task.name} (deferred) position to ${deferredPosition}`)
            task.position = deferredPosition++
            task.lastModificationDate = new Date().toISOString()
            updatedTaskIds.push(task.id)
          }
        })

        console.log('=== ALL TASK POSITIONS AFTER REORDER ===')
        tasks.forEach(t => {
          console.log(`${t.name}: priority=${t.priority}, position=${t.position}`)
        })
        console.log('=========================================')


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
export const getCurrentTasksForView = (store: AppState): TaskData[] => {
  if (isProjectList(store.currentPath)) return []
  
  const project = findProjectAtPath(store.projects, store.currentPath)
  if (!project) return []

  // Get tasks at the current path level
  let tasksToShow: TaskData[]
  if (isProject(store.currentPath)) {
    tasksToShow = project.tasks
  } else {
    const currentTask = findTaskAtPath(store.projects, store.currentPath)
    if (!currentTask) {
      // Path is invalid, return empty array
      return []
    }
    tasksToShow = currentTask.subtasks
  }

  // Helper function to sort tasks by priority first, then position, with fallback to creation date
  const sortByPriorityAndPosition = (tasks: TaskData[]) => {
    return tasks.sort((a, b) => {
      // First sort by priority (descending: normal=0 first, then deferred=-1)
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      
      // Within same priority group, sort by position
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position
      }
      // If only one has position, prioritize the one with position
      if (a.position !== undefined && b.position === undefined) return -1
      if (a.position === undefined && b.position !== undefined) return 1
      // If neither has position, sort by lastModificationDate (creation order)
      return a.lastModificationDate.localeCompare(b.lastModificationDate)
    })
  }

  // Apply search filter if there's a search query
  if (store.searchQuery.trim()) {
    const searchLower = store.searchQuery.toLowerCase().trim()
    tasksToShow = tasksToShow.filter((task) => 
      task.name.toLowerCase().includes(searchLower)
    )
  }

  // Filter and sort tasks based on showCompleted setting
  if (store.showCompleted) {
    // Show all tasks, with completed tasks sorted by completion date (most recent at bottom)
    const incompleteTasks = sortByPriorityAndPosition(tasksToShow.filter((task) => !task.completed))
    const completedTasks = tasksToShow
      .filter((task) => task.completed)
      .sort((a, b) => {
        // Compare ISO date strings - they sort naturally in chronological order
        const aTime = a.completionDate || ''
        const bTime = b.completionDate || ''
        return aTime.localeCompare(bTime) // Earlier completed tasks first, recent ones at bottom
      })

    return [...completedTasks, ...incompleteTasks]
  } else {
    // Show only incomplete tasks, sorted by position
    return sortByPriorityAndPosition(tasksToShow.filter((task) => !task.completed))
  }
}

export const getCurrentTaskChain = (store: AppState): TaskData[] => {
  if (isProjectList(store.currentPath) || isProject(store.currentPath)) return []
  
  const project = findProjectAtPath(store.projects, store.currentPath)
  if (!project) return []

  const chain: TaskData[] = []
  let currentTasks = project.tasks
  const taskPath = store.currentPath.slice(1) // Remove project ID
  for (const taskId of taskPath) {
    const task = currentTasks.find((t) => t.id === taskId)
    if (task) {
      chain.push(task)
      currentTasks = task.subtasks
    } else {
      break // Path broken
    }
  }
  return chain
}

