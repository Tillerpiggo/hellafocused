import { create } from "zustand"
import type { ProjectData, TaskItemData } from "@/lib/types"
import { initialProjectsData } from "@/lib/mock-data"
import { produce } from "immer"
import { triggerConfetti } from "@/lib/confetti"

interface AppState {
  projects: ProjectData[]
  selectedProjectId: string | null
  currentTaskPath: string[] // Stores IDs of tasks from root to current: [taskId, subtaskId, ...]
  isFocusMode: boolean
  focusModeProjectLeaves: TaskItemData[]
  currentFocusTask: TaskItemData | null
  showProjectSelectorDialog: boolean
  focusStartPath: string[] // The path where focus mode was started
  showTaskCompletionDialog: boolean
  pendingTaskCompletion: { projectId: string; taskPath: string[] } | null
  showCompleted: boolean
  showDeleteConfirmationDialog: boolean
  pendingDeletion: { projectId: string; taskPath: string[] } | null
  showAddTasksView: boolean
  // Actions
  selectProject: (projectId: string | null) => void
  navigateToTask: (taskId: string) => void
  navigateBack: () => void // Navigates one level up in task hierarchy or to project list

  toggleTaskCompletion: (projectId: string, taskPath: string[]) => void
  confirmTaskCompletion: () => void
  cancelTaskCompletion: () => void

  deleteTask: (projectId: string, taskPath: string[]) => void
  confirmDeletion: () => void
  cancelDeletion: () => void
  deleteProject: (projectId: string) => void

  enterFocusMode: (projectId?: string) => void
  exitFocusMode: () => void
  getNextFocusTask: () => void
  completeFocusTask: () => void
  keepGoingFocus: () => void
  breakTaskIntoSubtasks: (subtaskNames: string[]) => void

  setShowProjectSelectorDialog: (show: boolean) => void
  setShowAddTasksView: (show: boolean) => void

  toggleShowCompleted: () => void

  addSubtask: (projectId: string, parentTaskPath: string[], subtaskName: string) => void
  updateProjectName: (projectId: string, newName: string) => void
  updateTaskName: (projectId: string, taskPath: string[], newName: string) => void
  addProject: (projectName: string) => void
}

// Helper to find and update a task using Immer
const findAndUpdateTask = (tasks: TaskItemData[], path: string[], updateFn: (task: TaskItemData) => void): boolean => {
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

// Helper to find a task
const findTaskRecursive = (tasks: TaskItemData[], path: string[]): TaskItemData | undefined => {
  if (!path.length) return undefined
  const currentId = path[0]
  const task = tasks.find((t) => t.id === currentId)
  if (!task) return undefined
  if (path.length === 1) return task
  return findTaskRecursive(task.subtasks, path.slice(1))
}

// Helper to delete a task
const deleteTaskFromArray = (tasks: TaskItemData[], path: string[]): boolean => {
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

// Helper to count subtasks recursively
const countSubtasksRecursively = (task: TaskItemData): number => {
  if (!task.subtasks || task.subtasks.length === 0) return 0
  return task.subtasks.length + task.subtasks.reduce((acc, subtask) => acc + countSubtasksRecursively(subtask), 0)
}

// Helper to mark all subtasks as completed recursively
const markAllSubtasksCompleted = (task: TaskItemData) => {
  task.subtasks.forEach((subtask) => {
    subtask.completed = true
    subtask.completedAt = new Date().toISOString()
    markAllSubtasksCompleted(subtask)
  })
}

// Helper to get hierarchical leaf nodes starting from a specific path
const getHierarchicalLeafNodes = (tasks: TaskItemData[], startPath: string[]): TaskItemData[] => {
  // First, navigate to the starting point
  let currentTasks = tasks
  for (const pathId of startPath) {
    const task = currentTasks.find((t) => t.id === pathId)
    if (task) {
      currentTasks = task.subtasks
    } else {
      return []
    }
  }

  // Get leaf nodes at current level
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

  // Start with current level
  let allLeaves = getLeafNodesAtLevel(currentTasks)

  // If no leaves at current level, go up one level and get all leaves from there
  if (allLeaves.length === 0 && startPath.length > 0) {
    const parentPath = startPath.slice(0, -1)
    let parentTasks = tasks
    for (const pathId of parentPath) {
      const task = parentTasks.find((t) => t.id === pathId)
      if (task) {
        parentTasks = task.subtasks
      } else {
        return []
      }
    }
    allLeaves = getLeafNodesAtLevel(parentTasks)
  }

  // If no leaves at current level, get all project leaves
  if (allLeaves.length === 0) {
    allLeaves = getLeafNodesAtLevel(tasks)
  }

  return allLeaves
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: initialProjectsData,
  selectedProjectId: null,
  currentTaskPath: [],
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

  selectProject: (projectId) => set({ selectedProjectId: projectId, currentTaskPath: [] }),

  navigateToTask: (taskId) => set((state) => ({ currentTaskPath: [...state.currentTaskPath, taskId] })),

  navigateBack: () =>
    set((state) => {
      if (state.currentTaskPath.length > 0) {
        return { currentTaskPath: state.currentTaskPath.slice(0, -1) }
      }
      return { selectedProjectId: null, currentTaskPath: [] } // Go to project list
    }),

  toggleTaskCompletion: (projectId, taskPath) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return

    const task = findTaskRecursive(project.tasks, taskPath)
    if (!task) return

    // Check if task has incomplete subtasks
    const hasIncompleteSubtasks = task.subtasks.some((subtask) => !subtask.completed)

    if (!task.completed && hasIncompleteSubtasks) {
      // Show confirmation dialog
      set({
        showTaskCompletionDialog: true,
        pendingTaskCompletion: { projectId, taskPath },
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
        const project = draft.projects.find((p) => p.id === projectId)
        if (project) {
          findAndUpdateTask(project.tasks, taskPath, (task) => {
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
        }
      }),
    )
  },

  confirmTaskCompletion: () => {
    const { pendingTaskCompletion } = get()
    if (!pendingTaskCompletion) return

    const { projectId, taskPath } = pendingTaskCompletion

    // Trigger confetti for task completion
    if (typeof window !== "undefined") {
      triggerConfetti()
    }

    set(
      produce((draft: AppState) => {
        const project = draft.projects.find((p) => p.id === projectId)
        if (project) {
          findAndUpdateTask(project.tasks, taskPath, (task) => {
            task.completed = true
            task.completedAt = new Date().toISOString()
            markAllSubtasksCompleted(task)
          })
        }
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

  deleteTask: (projectId, taskPath) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return

    const task = findTaskRecursive(project.tasks, taskPath)
    if (!task) return

    // If there are subtasks, show a confirmation dialog
    const subtaskCount = countSubtasksRecursively(task)
    if (subtaskCount > 0) {
      set({
        showDeleteConfirmationDialog: true,
        pendingDeletion: { projectId, taskPath },
      })
      return
    }

    // If there are no subtasks, just delete it
    set(
      produce((draft: AppState) => {
        const project = draft.projects.find((p) => p.id === projectId)
        if (project) {
          deleteTaskFromArray(project.tasks, taskPath)

          // Navigate up one level if we can
          if (draft.currentTaskPath.length > 0) {
            draft.currentTaskPath = draft.currentTaskPath.slice(0, -1)
          }
        }
      }),
    )
  },

  confirmDeletion: () => {
    const { pendingDeletion } = get()
    if (!pendingDeletion) return

    const { projectId, taskPath } = pendingDeletion

    set(
      produce((draft: AppState) => {
        const project = draft.projects.find((p) => p.id === projectId)
        if (project) {
          deleteTaskFromArray(project.tasks, taskPath)

          // Navigate up one level if we can
          if (draft.currentTaskPath.length > 0) {
            draft.currentTaskPath = draft.currentTaskPath.slice(0, -1)
          }
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
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return

    // If the project has tasks, show a confirmation dialog
    const hasTasks = project.tasks.length > 0
    if (hasTasks) {
      set({
        showDeleteConfirmationDialog: true,
        pendingDeletion: { projectId, taskPath: [] },
      })
      return
    }

    // If there are no tasks, delete the project
    set(
      produce((draft: AppState) => {
        const projectIndex = draft.projects.findIndex((p) => p.id === projectId)
        if (projectIndex !== -1) {
          draft.projects.splice(projectIndex, 1)

          // Navigate to the project list
          draft.selectedProjectId = null
          draft.currentTaskPath = []
        }
      }),
    )
  },

  enterFocusMode: (projectIdToFocus?: string) => {
    const targetProjectId = projectIdToFocus || get().selectedProjectId
    if (!targetProjectId) {
      // Instead of showing dialog, randomly select a project
      const projects = get().projects
      if (projects.length === 0) return // No projects to focus on

      const randomProject = projects[Math.floor(Math.random() * projects.length)]
      const leaves = getHierarchicalLeafNodes(randomProject.tasks, [])
      set({
        isFocusMode: true,
        selectedProjectId: randomProject.id,
        focusStartPath: [],
        focusModeProjectLeaves: leaves,
        currentFocusTask: leaves.length > 0 ? leaves[Math.floor(Math.random() * leaves.length)] : null,
        showProjectSelectorDialog: false,
      })
      return
    }
    const project = get().projects.find((p) => p.id === targetProjectId)
    if (project) {
      const currentPath = get().currentTaskPath
      const leaves = getHierarchicalLeafNodes(project.tasks, currentPath)
      set({
        isFocusMode: true,
        selectedProjectId: targetProjectId,
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
    const { currentFocusTask, selectedProjectId } = get()
    if (currentFocusTask && selectedProjectId) {
      // Find the path to the currentFocusTask to mark it completed in the main projects data
      const findPath = (tasks: TaskItemData[], targetId: string, currentPath: string[] = []): string[] | null => {
        for (const task of tasks) {
          const newPath = [...currentPath, task.id]
          if (task.id === targetId) return newPath
          if (task.subtasks.length > 0) {
            const subPath = findPath(task.subtasks, targetId, newPath)
            if (subPath) return subPath
          }
        }
        return null
      }

      const project = get().projects.find((p) => p.id === selectedProjectId)
      if (project) {
        const taskPath = findPath(project.tasks, currentFocusTask.id)
        if (taskPath) {
          // Complete the task directly without showing dialog in focus mode
          set(
            produce((draft: AppState) => {
              const project = draft.projects.find((p) => p.id === selectedProjectId)
              if (project) {
                findAndUpdateTask(project.tasks, taskPath, (task) => {
                  task.completed = true
                  task.completedAt = new Date().toISOString()
                  markAllSubtasksCompleted(task)
                })
              }
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

  breakTaskIntoSubtasks: (subtaskNames: string[]) => {
    const { currentFocusTask, selectedProjectId } = get()
    if (!currentFocusTask || !selectedProjectId || subtaskNames.length === 0) return

    // Find the path to the current focus task
    const findPath = (tasks: TaskItemData[], targetId: string, currentPath: string[] = []): string[] | null => {
      for (const task of tasks) {
        const newPath = [...currentPath, task.id]
        if (task.id === targetId) return newPath
        if (task.subtasks.length > 0) {
          const subPath = findPath(task.subtasks, targetId, newPath)
          if (subPath) return subPath
        }
      }
      return null
    }

    const project = get().projects.find((p) => p.id === selectedProjectId)
    if (!project) return

    const taskPath = findPath(project.tasks, currentFocusTask.id)
    if (!taskPath) return

    // Add subtasks to the current focus task
    set(
      produce((draft: AppState) => {
        const project = draft.projects.find((p) => p.id === selectedProjectId)
        if (project) {
          findAndUpdateTask(project.tasks, taskPath, (task) => {
            // Add new subtasks
            const newSubtasks = subtaskNames.map((name) => ({
              id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name,
              completed: false,
              subtasks: [],
            }))
            task.subtasks.push(...newSubtasks)
          })
        }
      }),
    )

    // Update focus to prioritize the newly created subtasks
    const updatedProject = get().projects.find((p) => p.id === selectedProjectId)
    if (updatedProject) {
      const updatedTask = findTaskRecursive(updatedProject.tasks, taskPath)
      if (updatedTask) {
        // Get only the newly created subtasks (incomplete ones)
        const newSubtasks = updatedTask.subtasks.filter((st) => !st.completed)

        if (newSubtasks.length > 0) {
          set({
            focusStartPath: taskPath,
            focusModeProjectLeaves: newSubtasks,
            currentFocusTask: newSubtasks[Math.floor(Math.random() * newSubtasks.length)],
          })
        } else {
          // Fallback to hierarchical leaves if no new subtasks
          const leaves = getHierarchicalLeafNodes([updatedTask], [])
          set({
            focusStartPath: taskPath,
            focusModeProjectLeaves: leaves,
            currentFocusTask: leaves.length > 0 ? leaves[Math.floor(Math.random() * leaves.length)] : null,
          })
        }
      }
    }
  },

  keepGoingFocus: () => {
    const { selectedProjectId, focusStartPath, projects } = get()
    if (!selectedProjectId) return

    const project = projects.find((p) => p.id === selectedProjectId)
    if (!project) return

    // If we were focusing at a specific task level, show the parent task
    if (focusStartPath.length > 0) {
      const parentTask = findTaskRecursive(project.tasks, focusStartPath)
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
      const leaves = getHierarchicalLeafNodes(project.tasks, parentPath)

      set({
        focusStartPath: parentPath,
        focusModeProjectLeaves: leaves,
        currentFocusTask: leaves.length > 0 ? leaves[Math.floor(Math.random() * leaves.length)] : null,
      })
    } else {
      // We were at project level, pick a random project
      const availableProjects = projects.filter((p) => p.id !== selectedProjectId)
      if (availableProjects.length > 0) {
        const randomProject = availableProjects[Math.floor(Math.random() * availableProjects.length)]
        const leaves = getHierarchicalLeafNodes(randomProject.tasks, [])

        set({
          selectedProjectId: randomProject.id,
          focusStartPath: [],
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

  addSubtask: (projectId, parentTaskPath, subtaskName) =>
    set(
      produce((draft: AppState) => {
        const project = draft.projects.find((p) => p.id === projectId)
        if (project) {
          const newTask: TaskItemData = {
            id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More robust ID
            name: subtaskName,
            completed: false,
            subtasks: [],
          }

          // If parentTaskPath is empty, add to project root
          if (parentTaskPath.length === 0) {
            project.tasks.push(newTask)
          } else {
            // Find the parent task and add to its subtasks
            const parentTask = findTaskRecursive(project.tasks, parentTaskPath)
            if (parentTask) {
              parentTask.subtasks.push(newTask)
            }
          }
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

  updateTaskName: (projectId, taskPath, newName) =>
    set(
      produce((draft: AppState) => {
        const project = draft.projects.find((p) => p.id === projectId)
        if (project) {
          findAndUpdateTask(project.tasks, taskPath, (task) => {
            task.name = newName
          })
        }
      }),
    ),
  addProject: (projectName) =>
    set(
      produce((draft: AppState) => {
        const newProject: ProjectData = {
          id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: projectName,
          tasks: [],
        }
        draft.projects.push(newProject)
      }),
    ),
}))

// Helper to get current tasks to display based on path
export const getCurrentTasksForView = (store: AppState): TaskItemData[] => {
  if (!store.selectedProjectId) return []
  const project = store.projects.find((p) => p.id === store.selectedProjectId)
  if (!project) return []

  let tasksToShow = project.tasks
  let currentLevelTasks = project.tasks
  for (const taskId of store.currentTaskPath) {
    const foundTask = currentLevelTasks.find((t) => t.id === taskId)
    if (foundTask && foundTask.subtasks) {
      tasksToShow = foundTask.subtasks
      currentLevelTasks = foundTask.subtasks
    } else {
      // Path is invalid or task has no subtasks, show parent's tasks or empty
      return foundTask ? [] : tasksToShow
    }
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
  if (!store.selectedProjectId || store.currentTaskPath.length === 0) return []
  const project = store.projects.find((p) => p.id === store.selectedProjectId)
  if (!project) return []

  const chain: TaskItemData[] = []
  let currentTasks = project.tasks
  for (const taskId of store.currentTaskPath) {
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
