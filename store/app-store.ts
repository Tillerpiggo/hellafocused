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
    console.log(`📱 AppStore.toggleTaskCompletion called with taskPath:`, taskPath)
    const task = findTaskAtPath(get().projects, taskPath)
    if (!task) {
      console.log(`📱 Task not found at path:`, taskPath)
      return
    }

    console.log(`📱 Found task "${task.name}", current completed state: ${task.completed}`)

    // Trigger confetti for task completion (only when completing, not uncompleting)
    if (!task.completed) {
      console.log(`📱 Triggering confetti for task completion`)
      triggerConfetti()
    }

    // Proceed with completion
    console.log(`📱 Updating task completion state...`)
    set(
      produce((draft: AppState) => {
        updateTaskAtPath(draft.projects, taskPath, (task) => {
          task.completed = !task.completed
          task.updateDate = new Date().toISOString()
          console.log(`📱 Task "${task.name}" completed state changed to: ${task.completed}`)

          // If completing a task, mark all subtasks as completed too and set completion date
          if (task.completed) {
            task.completionDate = new Date().toISOString()
            console.log(`📱 Set completion date: ${task.completionDate}`)
            markAllSubtasksCompleted(task)
            console.log(`📱 Marked all subtasks as completed`)
            // DO NOT automatically change showCompleted state here
          } else {
            // If uncompleting, remove completion date
            delete task.completionDate
            console.log(`📱 Removed completion date`)
          }
        })
      }),
    )

    console.log(`📱 Calling trackTaskUpdated for taskPath:`, taskPath)
    trackTaskUpdated(taskPath)
    console.log(`📱 toggleTaskCompletion completed`)
  },

  deleteAtPath: (itemPath) => {
    console.log(`📱 AppStore.deleteAtPath called with itemPath:`, itemPath)
    
    // Track deletion before actually deleting
    if (itemPath.length === 1) {
      // Deleting a project
      console.log(`📱 Tracking project deletion for projectId: ${itemPath[0]}`)
      trackProjectDeleted(itemPath[0])
    } else {
      // Deleting a task
      console.log(`📱 Tracking task deletion for taskPath:`, itemPath)
      trackTaskDeleted(itemPath)
    }

    console.log(`📱 Proceeding with actual deletion...`)
    set(
      produce((draft: AppState) => {
        deleteAtPath(draft.projects, itemPath)
        console.log(`📱 Item deleted from store`)

        // If the current path is no longer valid, navigate up appropriately
        if (!findTaskAtPath(draft.projects, draft.currentPath) && !findProjectAtPath(draft.projects, draft.currentPath)) {
          console.log(`📱 Current path is invalid, navigating up from:`, draft.currentPath)
          draft.currentPath = draft.currentPath.slice(0, -1)
          console.log(`📱 New current path:`, draft.currentPath)
        }
      }),
    )
    console.log(`📱 deleteAtPath completed`)
  },

  toggleShowCompleted: () => set((state) => ({ showCompleted: !state.showCompleted })),

  addSubtaskToParent: (parentPath, subtaskName) => {
    console.log(`📱 AppStore.addSubtaskToParent called with:`)
    console.log(`📱   parentPath:`, parentPath)
    console.log(`📱   subtaskName: "${subtaskName}"`)

    set(
      produce((draft: AppState) => {
        if (parentPath.length === 0) {
          console.log(`📱 Cannot add to empty path, returning`)
          return // Can't add to empty path
        }

        const project = draft.projects.find((p) => p.id === parentPath[0])
        if (!project) {
          console.log(`📱 Project not found for ID: ${parentPath[0]}`)
          return
        }

        console.log(`📱 Found project: "${project.name}"`)

        const newTaskId = uuidv4()
        const newTask: TaskData = {
          id: newTaskId,
          name: subtaskName,
          completed: false,
          updateDate: new Date().toISOString(),
          subtasks: [],
        }

        console.log(`📱 Created new task with ID: ${newTaskId}`)

        // If parentPath is project level, add to project root
        if (parentPath.length === 1) {
          console.log(`📱 Adding task to project root`)
          project.tasks.push(newTask)
          console.log(`📱 Project now has ${project.tasks.length} tasks`)
        } else {
          console.log(`📱 Adding task to parent task via addTaskToParent`)
          addTaskToParent(draft.projects, parentPath, newTask)
          console.log(`📱 Task added to parent`)
        }
      }),
    )

    console.log(`📱 Calling trackTaskCreated for parentPath:`, parentPath)
    trackTaskCreated(parentPath)
    console.log(`📱 addSubtaskToParent completed`)
  },

  updateProjectName: (projectId, newName) => {
    console.log(`📱 AppStore.updateProjectName called:`)
    console.log(`📱   projectId: ${projectId}`)
    console.log(`📱   newName: "${newName}"`)

    set(
      produce((draft: AppState) => {
        const project = draft.projects.find((p) => p.id === projectId)
        if (project) {
          const oldName = project.name
          project.name = newName
          project.updateDate = new Date().toISOString()
          console.log(`📱 Project name updated from "${oldName}" to "${newName}"`)
        } else {
          console.log(`📱 Project not found for ID: ${projectId}`)
        }
      }),
    )

    console.log(`📱 Calling trackProjectUpdated for projectId: ${projectId}`)
    trackProjectUpdated(projectId)
    console.log(`📱 updateProjectName completed`)
  },

  updateTaskName: (taskPath, newName) => {
    console.log(`📱 AppStore.updateTaskName called:`)
    console.log(`📱   taskPath:`, taskPath)
    console.log(`📱   newName: "${newName}"`)

    set(
      produce((draft: AppState) => {
        updateTaskAtPath(draft.projects, taskPath, (task) => {
          const oldName = task.name
          task.name = newName
          task.updateDate = new Date().toISOString()
          console.log(`📱 Task name updated from "${oldName}" to "${newName}"`)
        })
      }),
    )

    console.log(`📱 Calling trackTaskUpdated for taskPath:`, taskPath)
    trackTaskUpdated(taskPath)
    console.log(`📱 updateTaskName completed`)
  },

  addProject: (projectName) => {
    console.log(`📱 AppStore.addProject called with projectName: "${projectName}"`)
    
    const newProjectId = uuidv4()
    const newProject: ProjectData = {
      id: newProjectId,
      name: projectName,
      updateDate: new Date().toISOString(),
      tasks: [],
    }

    console.log(`📱 Created new project with ID: ${newProjectId}`)

    set(
      produce((draft: AppState) => {
        draft.projects.push(newProject)
        console.log(`📱 Project added to store. Total projects: ${draft.projects.length}`)
      }),
    )

    console.log(`📱 Calling trackProjectCreated for projectId: ${newProjectId}`)
    trackProjectCreated(newProject.id)
    console.log(`📱 addProject completed`)
  },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentPath: state.currentPath,
        showCompleted: state.showCompleted,
      }),
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

  // Filter and sort tasks based on showCompleted setting
  if (store.showCompleted) {
    // Show all tasks, with completed tasks sorted by completion date (most recent at bottom)
    const incompleteTasks = tasksToShow.filter((task) => !task.completed)
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
    // Show only incomplete tasks
    return tasksToShow.filter((task) => !task.completed)
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

