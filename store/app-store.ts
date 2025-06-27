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
  getHierarchicalLeafNodes,
  findTaskPath,
  findTaskByPath,
  findProjectByPath,
  updateTaskByPath,
  deleteByPath,
  addTaskToParent,
  getProjectId,
  isProject,
  isProjectList,
} from "@/lib/task-utils"

interface AppState {
  projects: ProjectData[]
  currentPath: string[] // [] for project list, [projectId] for project, [projectId, taskId, ...] for tasks
  isFocusMode: boolean
  focusModeProjectLeaves: TaskItemData[]
  currentFocusTask: TaskItemData | null
  showProjectSelectorDialog: boolean
  focusStartPath: string[] // The path where focus mode was started
  showTaskCompletionDialog: boolean
  pendingTaskCompletion: string[] | null
  showCompleted: boolean
  showDeleteConfirmationDialog: boolean
  pendingDeletion: string[] | null
  showAddTasksView: boolean
  // Actions
  selectProject: (projectId: string | null) => void
  navigateToTask: (taskId: string) => void
  navigateBack: () => void // Navigates one level up in task hierarchy or to project list

  toggleTaskCompletion: (taskPath: string[]) => void
  confirmTaskCompletion: () => void
  cancelTaskCompletion: () => void

  deleteTask: (taskPath: string[]) => void
  confirmDeletion: () => void
  cancelDeletion: () => void
  deleteProject: (projectId: string) => void

  enterFocusMode: (projectId?: string) => void
  exitFocusMode: () => void
  getNextFocusTask: () => void
  completeFocusTask: () => void
  keepGoingFocus: () => void

  setShowProjectSelectorDialog: (show: boolean) => void
  setShowAddTasksView: (show: boolean) => void

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
  focusModeProjectLeaves: [],
  currentFocusTask: null,
  showProjectSelectorDialog: false,
  focusStartPath: [],
  showTaskCompletionDialog: false,
  pendingTaskCompletion: null,
  showCompleted: false,
  showDeleteConfirmationDialog: false,
  pendingDeletion: null,
  showAddTasksView: false,

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

    // Check if task has incomplete subtasks
    const hasIncompleteSubtasks = task.subtasks.some((subtask) => !subtask.completed)

    if (!task.completed && hasIncompleteSubtasks) {
      // Show confirmation dialog
      set({
        showTaskCompletionDialog: true,
        pendingTaskCompletion: taskPath,
      })
      return
    }

    // Trigger confetti for task completion (only when completing, not uncompleting)
    if (!task.completed && typeof window !== "undefined") {
      triggerConfetti()
    }

    // Proceed with completion
    set(
      produce((draft: AppState) => {
        updateTaskByPath(draft.projects, taskPath, (task) => {
          task.completed = !task.completed

          // If completing a task, mark all subtasks as completed too and set completion time
          if (task.completed) {
            task.completedAt = new Date().toISOString()
            markAllSubtasksCompleted(task)
            // DO NOT automatically change showCompleted state here
          } else {
            // If uncompleting, remove completion time
            delete task.completedAt
          }
        })
      }),
    )
  },

  confirmTaskCompletion: () => {
    const { pendingTaskCompletion } = get()
    if (!pendingTaskCompletion) return

    // Trigger confetti for task completion
    if (typeof window !== "undefined") {
      triggerConfetti()
    }

    set(
      produce((draft: AppState) => {
        updateTaskByPath(draft.projects, pendingTaskCompletion, (task) => {
          task.completed = true
          task.completedAt = new Date().toISOString()
          markAllSubtasksCompleted(task)
        })
        draft.showTaskCompletionDialog = false
        draft.pendingTaskCompletion = null
        // DO NOT automatically change showCompleted state here
      }),
    )
  },

  cancelTaskCompletion: () => {
    set({
      showTaskCompletionDialog: false,
      pendingTaskCompletion: null,
    })
  },

  deleteTask: (taskPath) => {
    const task = findTaskByPath(get().projects, taskPath)
    if (!task) return

    // If there are subtasks, show a confirmation dialog
    if (task.subtasks.length > 0) {
      set({
        showDeleteConfirmationDialog: true,
        pendingDeletion: taskPath,
      })
      return
    }

    // If there are no subtasks, just delete it
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

  confirmDeletion: () => {
    const { pendingDeletion } = get()
    if (!pendingDeletion) return

    set(
      produce((draft: AppState) => {
        deleteByPath(draft.projects, pendingDeletion)

        // Navigate up one level if we can
        if (draft.currentPath.length > 0) {
          draft.currentPath = draft.currentPath.slice(0, -1)
        }
        draft.showDeleteConfirmationDialog = false
        draft.pendingDeletion = null
      }),
    )
  },

  cancelDeletion: () => {
    set({
      showDeleteConfirmationDialog: false,
      pendingDeletion: null,
    })
  },

  deleteProject: (projectId) => {
    const projectPath = [projectId]
    const project = findProjectByPath(get().projects, path)
    if (!project) return

    // If the project has tasks, show a confirmation dialog
    const hasTasks = project.tasks.length > 0
    if (hasTasks) {
      set({
        showDeleteConfirmationDialog: true,
        pendingDeletion: projectPath,
      })
      return
    }

    // If there are no tasks, delete the project
    set(
      produce((draft: AppState) => {
        deleteByPath(draft.projects, projectPath)
        draft.currentPath = [] // Navigate to the project list
      }),
    )
  },

  enterFocusMode: (projectIdToFocus?: string) => {
    const currentProjectId = projectIdToFocus || getProjectId(get().currentPath)
    if (!currentProjectId) {
      // Instead of showing dialog, randomly select a project
      const projects = get().projects
      if (projects.length === 0) return // No projects to focus on

      const randomProject = projects[Math.floor(Math.random() * projects.length)]
      const leaves = getHierarchicalLeafNodes(randomProject.tasks, [])
      set({
        isFocusMode: true,
        currentPath: [randomProject.id],
        focusStartPath: [randomProject.id],
        focusModeProjectLeaves: leaves,
        currentFocusTask: leaves.length > 0 ? leaves[Math.floor(Math.random() * leaves.length)] : null,
        showProjectSelectorDialog: false,
      })
      return
    }
    const project = get().projects.find((p) => p.id === currentProjectId)
    if (project) {
      const currentPath = get().currentPath
      const taskPath = isProject(currentPath) ? [] : currentPath.slice(1) // Get task path within project
      const leaves = getHierarchicalLeafNodes(project.tasks, taskPath)
      set({
        isFocusMode: true,
        currentPath: [currentProjectId],
        focusStartPath: currentPath,
        focusModeProjectLeaves: leaves,
        currentFocusTask: leaves.length > 0 ? leaves[Math.floor(Math.random() * leaves.length)] : null,
        showProjectSelectorDialog: false,
      })
    }
  },

  exitFocusMode: () =>
    set({ isFocusMode: false, currentFocusTask: null, focusModeProjectLeaves: [], focusStartPath: [] }),

  getNextFocusTask: () =>
    set((state) => {
      const availableLeaves = state.focusModeProjectLeaves.filter(
        (leaf) => leaf.id !== state.currentFocusTask?.id && !leaf.completed,
      )
      // Pick a random task from the available leaves
      if (availableLeaves.length > 0) {
        return { currentFocusTask: availableLeaves[Math.floor(Math.random() * availableLeaves.length)] }
      }
      // If current task was the last one, or all are completed
      const allLeaves = state.focusModeProjectLeaves.filter((leaf) => !leaf.completed)
      if (allLeaves.length > 0) {
        return { currentFocusTask: allLeaves[Math.floor(Math.random() * allLeaves.length)] }
      }
      return { currentFocusTask: null } // All tasks completed
    }),

  completeFocusTask: () => {
    const { currentFocusTask } = get()
    const currentProjectId = getProjectId(get().currentPath)
    if (currentFocusTask && currentProjectId) {
      // Find the path to the currentFocusTask to mark it completed in the main projects data
      const project = get().projects.find((p) => p.id === currentProjectId)
      if (project) {
        const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
        if (taskPathInProject) {
          const fullTaskPath = [currentProjectId, ...taskPathInProject]
          // Complete the task directly without showing dialog in focus mode
          set(
            produce((draft: AppState) => {
              updateTaskByPath(draft.projects, fullTaskPath, (task) => {
                task.completed = true
                task.completedAt = new Date().toISOString()
                markAllSubtasksCompleted(task)
              })
            }),
          )
        }
      }

      // Update focusModeProjectLeaves but DON'T get next task automatically
      set(
        produce((draft: AppState) => {
          if (draft.currentFocusTask) {
            const taskInLeaves = draft.focusModeProjectLeaves.find((t) => t.id === draft.currentFocusTask!.id)
            if (taskInLeaves) taskInLeaves.completed = true
          }
        }),
      )
    }
  },

  keepGoingFocus: () => {
    const { focusStartPath, projects } = get()
    const currentProjectId = getProjectId(get().currentPath)
    if (!currentProjectId) return

    const project = projects.find((p) => p.id === currentProjectId)
    if (!project) return

    // If we were focusing at a specific task level, show the parent task
    if (focusStartPath.length > 1) {
      const parentTask = findTaskByPath(projects, focusStartPath)
      if (parentTask && !parentTask.completed) {
        // Show the parent task as the focus task
        set({
          currentFocusTask: parentTask,
          focusModeProjectLeaves: [parentTask],
        })
        return
      }

      // If parent is completed or doesn't exist, go one level up
      const parentPath = focusStartPath.slice(0, -1)
      const taskPath = isProject(parentPath) ? [] : parentPath.slice(1)
      const leaves = getHierarchicalLeafNodes(project.tasks, taskPath)

      set({
        focusStartPath: parentPath,
        focusModeProjectLeaves: leaves,
        currentFocusTask: leaves.length > 0 ? leaves[Math.floor(Math.random() * leaves.length)] : null,
      })
    } else {
      // We were at project level, pick a random project
      const availableProjects = projects.filter((p) => p.id !== currentProjectId)
      if (availableProjects.length > 0) {
        const randomProject = availableProjects[Math.floor(Math.random() * availableProjects.length)]
        const leaves = getHierarchicalLeafNodes(randomProject.tasks, [])

        set({
          currentPath: [randomProject.id],
          focusStartPath: [randomProject.id],
          focusModeProjectLeaves: leaves,
          currentFocusTask: leaves.length > 0 ? leaves[Math.floor(Math.random() * leaves.length)] : null,
        })
      } else {
        // No other projects, exit focus mode
        get().exitFocusMode()
      }
    }
  },

  setShowProjectSelectorDialog: (show) => set({ showProjectSelectorDialog: show }),

  setShowAddTasksView: (show) => set({ showAddTasksView: show }),

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
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
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

