import { create } from "zustand"
import type { ProjectData, TaskItemData } from "@/lib/types"
import { initialProjectsData } from "@/lib/mock-data"
import { produce } from "immer"
import { triggerConfetti } from "@/lib/confetti"
import { v4 as uuidv4 } from "uuid"
import {
  findAndUpdateTask,
  findTaskRecursive,
  deleteTaskFromArray,
  markAllSubtasksCompleted,
  findTaskByPath,
  findProjectByPath,
  updateTaskByPath,
  deleteByPath,
  addTaskToParent,
  isProject,
  isProjectList,
} from "@/lib/task-utils"

interface AppState {
  projects: ProjectData[]
  currentPath: string[] // [] for project list, [projectId] for project, [projectId, taskId, ...] for tasks
  isFocusMode: boolean
  showCompleted: boolean
  // Actions
  selectProject: (projectId: string | null) => void
  navigateToTask: (taskId: string) => void
  navigateBack: () => void // Navigates one level up in task hierarchy or to project list

  toggleTaskCompletion: (taskPath: string[]) => void
  deleteTask: (taskPath: string[]) => void
  deleteProject: (projectId: string) => void

  enterFocusMode: () => void
  exitFocusMode: () => void

  toggleShowCompleted: () => void

  addSubtaskToParent: (parentPath: string[], subtaskName: string) => void
  updateProjectName: (projectId: string, newName: string) => void
  updateTaskName: (taskPath: string[], newName: string) => void
  addProject: (projectName: string) => void
}



export const useAppStore = create<AppState>((set, get) => ({
  projects: initialProjectsData,
  currentPath: [], // Start at project list
  isFocusMode: false,
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
    const task = findTaskByPath(get().projects, taskPath)
    if (!task) return

    // Trigger confetti for task completion (only when completing, not uncompleting)
    if (!task.completed) {
      triggerConfetti()
    }

    // Proceed with completion
    set(
      produce((draft: AppState) => {
        updateTaskByPath(draft.projects, taskPath, (task) => {
          task.completed = !task.completed

          // If completing a task, mark all subtasks as completed too and set completion date
          if (task.completed) {
            task.completionDate = new Date()
            markAllSubtasksCompleted(task)
            // DO NOT automatically change showCompleted state here
          } else {
            // If uncompleting, remove completion date
            delete task.completionDate
          }
        })
      }),
    )
  },

  deleteTask: (taskPath) => {
    set(
      produce((draft: AppState) => {
        deleteByPath(draft.projects, taskPath)

        // If the current path is no longer valid, navigate up one level
        if (!findTaskByPath(draft.projects, draft.currentPath) && !findProjectByPath(draft.projects, draft.currentPath)) {
          draft.currentPath = draft.currentPath.slice(0, -1)
        }
      }),
    )
  },

  deleteProject: (projectId) => {
    const projectPath = [projectId]
    set(
      produce((draft: AppState) => {
        deleteByPath(draft.projects, projectPath)
        draft.currentPath = [] // Navigate to the project list
      }),
    )
  },

  enterFocusMode: () => set({ isFocusMode: true }),

  exitFocusMode: () => set({ isFocusMode: false }),

  toggleShowCompleted: () => set((state) => ({ showCompleted: !state.showCompleted })),

  addSubtaskToParent: (parentPath, subtaskName) =>
    set(
      produce((draft: AppState) => {
        const newTask: TaskItemData = {
          id: uuidv4(),
          name: subtaskName,
          completed: false,
          subtasks: [],
        }

        if (parentPath.length === 0) return // Can't add to empty path

        const project = draft.projects.find((p) => p.id === parentPath[0])
        if (!project) return

        // If parentPath is project level, add to project root
        if (parentPath.length === 1) {
          project.tasks.push(newTask)
        } else {
          addTaskToParent(draft.projects, parentPath, newTask)
        }
      }),
    ),

  updateProjectName: (projectId, newName) =>
    set(
      produce((draft: AppState) => {
        const project = draft.projects.find((p) => p.id === projectId)
        if (project) {
          project.name = newName
        }
      }),
    ),

  updateTaskName: (taskPath, newName) =>
    set(
      produce((draft: AppState) => {
        updateTaskByPath(draft.projects, taskPath, (task) => {
          task.name = newName
        })
      }),
    ),

  addProject: (projectName) =>
    set(
      produce((draft: AppState) => {
        const newProject: ProjectData = {
          id: uuidv4(),
          name: projectName,
          tasks: [],
        }
        draft.projects.push(newProject)
      }),
    ),
}))

// Helper to get current tasks to display based on path
export const getCurrentTasksForView = (store: AppState): TaskItemData[] => {
  if (isProjectList(store.currentPath)) return []
  
  const project = findProjectByPath(store.projects, store.currentPath)
  if (!project) return []

  // Get tasks at the current path level
  let tasksToShow: TaskItemData[]
  if (isProject(store.currentPath)) {
    tasksToShow = project.tasks
  } else {
    const currentTask = findTaskByPath(store.projects, store.currentPath)
    if (!currentTask) {
      // Path is invalid, return empty array
      return []
    }
    tasksToShow = currentTask.subtasks
  }

  // Filter and sort tasks based on showCompleted setting
  if (store.showCompleted) {
    // Show all tasks, with completed tasks sorted by completion date (most recent at bottom)
    const incompleteTasks = tasksToShow.filter((task) => !task.completed)
    const completedTasks = tasksToShow
      .filter((task) => task.completed)
      .sort((a, b) => {
        const aTime = a.completionDate ? a.completionDate.getTime() : 0
        const bTime = b.completionDate ? b.completionDate.getTime() : 0
        return aTime - bTime // Earlier completed tasks first, recent ones at bottom
      })

    return [...completedTasks, ...incompleteTasks]
  } else {
    // Show only incomplete tasks
    return tasksToShow.filter((task) => !task.completed)
  }
}

export const getCurrentTaskChain = (store: AppState): TaskItemData[] => {
  if (isProjectList(store.currentPath) || isProject(store.currentPath)) return []
  
  const project = findProjectByPath(store.projects, store.currentPath)
  if (!project) return []

  const chain: TaskItemData[] = []
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

