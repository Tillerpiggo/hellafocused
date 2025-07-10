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
  // Actions
  selectProject: (projectId: string | null) => void
  navigateToTask: (taskId: string) => void
  navigateBack: () => void // Navigates one level up in task hierarchy or to project list

  toggleTaskCompletion: (taskPath: string[]) => void
  deleteAtPath: (itemPath: string[]) => void

  toggleShowCompleted: () => void

  addSubtaskToParent: (parentPath: string[], subtaskName: string) => void
  updateProjectName: (projectId: string, newName: string) => void
  updateTaskName: (taskPath: string[], newName: string) => void
  addProject: (projectName: string) => void
  reorderTasks: (parentPath: string[], fromIndex: number, toIndex: number) => void
  clearLocalState: () => void
}



export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: initialProjectsData,
      currentPath: [], // Start at project list
      showCompleted: false,

  selectProject: (projectId) => set({ currentPath: projectId ? [projectId] : [] }),

  navigateToTask: (taskId) => set((state) => ({ currentPath: [...state.currentPath, taskId] })),

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

  deleteAtPath: (itemPath) => {
    
    // Track deletion before actually deleting
    if (itemPath.length === 1) {
      // Deleting a project
      trackProjectDeleted(itemPath[0])
    } else {
      // Deleting a task
      trackTaskDeleted(itemPath)
    }

    set(
      produce((draft: AppState) => {
        deleteAtPath(draft.projects, itemPath)

        // If the current path is no longer valid, navigate up appropriately
        if (!findTaskAtPath(draft.projects, draft.currentPath) && !findProjectAtPath(draft.projects, draft.currentPath)) {
          draft.currentPath = draft.currentPath.slice(0, -1)
        }
      }),
    )
  },

  toggleShowCompleted: () => set((state) => ({ showCompleted: !state.showCompleted })),

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
    const newProject: ProjectData = {
      id: newProjectId,
      name: projectName,
      lastModificationDate: new Date().toISOString(),
      tasks: [],
    }


    set(
      produce((draft: AppState) => {
        draft.projects.push(newProject)
      }),
    )
  
    trackProjectCreated(newProject.id)
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
        // Sort by position to match what's displayed in TaskListView
        const incompleteTasks = tasks
          .filter(task => !task.completed)
          .sort((a, b) => {
            // Sort by position, with fallback to creation date for missing positions
            if (a.position !== undefined && b.position !== undefined) {
              return a.position - b.position
            }
            if (a.position !== undefined && b.position === undefined) return -1
            if (a.position === undefined && b.position !== undefined) return 1
            return a.lastModificationDate.localeCompare(b.lastModificationDate)
          })
        
        if (fromIndex >= incompleteTasks.length || toIndex >= incompleteTasks.length) return



        // Remove the task from the old position and insert at new position
        const [movedTask] = incompleteTasks.splice(fromIndex, 1)
        incompleteTasks.splice(toIndex, 0, movedTask)

        // Update positions for all affected tasks and collect their IDs for sync
        incompleteTasks.forEach((task, index) => {
          task.position = index
          task.lastModificationDate = new Date().toISOString()
          updatedTaskIds.push(task.id)
        })


      }),
    )

    // Track each affected task for sync AFTER state update is committed
    updatedTaskIds.forEach(taskId => {
      const taskPath = [...parentPath, taskId]
      trackTaskUpdated(taskPath)
    })
  },

  clearLocalState: () => set({
    projects: initialProjectsData,
    currentPath: [],
    showCompleted: false,
  }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentPath: state.currentPath,
        showCompleted: state.showCompleted,
      }),
      onRehydrateStorage: () => (state) => {
        // Fill missing positions for any existing tasks when loading from storage
        if (state?.projects) {
          fillMissingPositionsForProjects(state.projects)
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

  // Helper function to sort tasks by position, with fallback to creation date for missing positions
  const sortByPosition = (tasks: TaskData[]) => {
    return tasks.sort((a, b) => {
      // If both tasks have positions, sort by position
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

  // Filter and sort tasks based on showCompleted setting
  if (store.showCompleted) {
    // Show all tasks, with completed tasks sorted by completion date (most recent at bottom)
    const incompleteTasks = sortByPosition(tasksToShow.filter((task) => !task.completed))
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
    return sortByPosition(tasksToShow.filter((task) => !task.completed))
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

