import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProjectData, TaskData } from "@/lib/types"
import type { TaskPath } from "@/lib/task-path"
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
  reindexTaskPositions,
  moveTaskToNewParent,
} from "@/lib/task-utils"
import { useNavigationStore } from "./navigation-store"
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
  showCompleted: boolean
  searchQuery: string

  toggleTaskCompletion: (taskPath: TaskPath) => void
  toggleTaskDefer: (taskPath: TaskPath) => void
  toggleTaskPrefer: (taskPath: TaskPath) => void
  setTaskPriority: (taskPath: TaskPath, priority: number) => void
  moveTaskWithPriorityChange: (taskPath: TaskPath, globalSourceIndex: number, globalDestinationIndex: number, newPriority: number) => void
  deleteAtPath: (itemPath: TaskPath) => void

  toggleShowCompleted: () => void
  setSearchQuery: (query: string) => void

  addSubtaskToParent: (parentPath: TaskPath, subtaskName: string) => void
  updateProjectName: (projectId: string, newName: string) => void
  updateTaskName: (taskPath: TaskPath, newName: string) => void
  updateTaskDescription: (taskPath: TaskPath, newDescription: string) => void
  toggleTaskOrdered: (taskPath: TaskPath) => void
  addProject: (projectName: string) => void
  reorderTasks: (parentPath: TaskPath, fromIndex: number, toIndex: number) => void
  reorderProjects: (fromIndex: number, toIndex: number) => void
  moveTaskToNewParent: (taskPath: TaskPath, newParentPath: TaskPath, newPosition?: number) => void
  clearLocalState: () => void
}

const normalizePersistedTask = (task: TaskData): TaskData => ({
  id: task.id,
  name: task.name,
  description: task.description,
  completed: task.completed,
  completionDate: task.completionDate,
  lastModificationDate: task.lastModificationDate,
  position: task.position,
  priority: task.priority,
  isOrdered: task.isOrdered,
  subtasks: (task.subtasks ?? []).map(normalizePersistedTask),
})

export const normalizePersistedProjects = (projects: ProjectData[]): ProjectData[] => (
  projects.map((project) => ({
    id: project.id,
    name: project.name,
    lastModificationDate: project.lastModificationDate,
    position: project.position,
    tasks: project.tasks.map(normalizePersistedTask),
  }))
)



export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: initialProjectsData,
      showCompleted: false,
      searchQuery: "",

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
    let affectedTaskPaths: TaskPath[] = []
    
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
    let affectedTaskPaths: TaskPath[] = []
    
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
    let affectedTaskPaths: TaskPath[] = []
    set(
      produce((draft: AppState) => {
        affectedTaskPaths = moveTaskWithPriorityChange(
          draft.projects,
          taskPath,
          globalSourceIndex,
          globalDestinationIndex,
          newPriority,
        )
      }),
    )
    affectedTaskPaths.forEach(trackTaskUpdated)
  },

  deleteAtPath: (itemPath) => {
    let affectedTaskPaths: TaskPath[] = []
    
    set(
      produce((draft: AppState) => {
        affectedTaskPaths = deleteAtPath(draft.projects, itemPath)
      }),
    )

    const currentPath = useNavigationStore.getState().currentPath
    const projects = get().projects
    if (
      !isProjectList(currentPath) &&
      !findTaskAtPath(projects, currentPath) &&
      !findProjectAtPath(projects, currentPath)
    ) {
      useNavigationStore.getState().navigateBack()
    }

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


    let affectedTaskPaths: TaskPath[] = []

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

        affectedTaskPaths = reindexTaskPositions(incompleteTasks, parentPath)
      }),
    )

    affectedTaskPaths.forEach(trackTaskUpdated)
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
    let result: { success: boolean; sourceAffectedTaskPaths: TaskPath[]; destinationAffectedTaskPaths: TaskPath[] } = {
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

  clearLocalState: () => {
    set({
      projects: initialProjectsData,
      showCompleted: false,
      searchQuery: "",
    })
    useNavigationStore.getState().resetNavigation()
  },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        projects: state.projects,
        showCompleted: state.showCompleted,
        searchQuery: state.searchQuery,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<Pick<
          AppState,
          "projects" | "showCompleted" | "searchQuery"
        >>
        return {
          ...currentState,
          projects: persisted.projects
            ? normalizePersistedProjects(persisted.projects)
            : currentState.projects,
          showCompleted: persisted.showCompleted ?? currentState.showCompleted,
          searchQuery: persisted.searchQuery ?? currentState.searchQuery,
        }
      },
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

interface ResolvedCurrentPath {
  project: ProjectData | null
  taskChain: TaskData[]
  currentTask: TaskData | null
}

export interface CurrentTaskViewData extends ResolvedCurrentPath {
  tasks: TaskData[]
  orderedNumberMap: Record<string, number>
}

const sortByPriorityAndPosition = (tasks: TaskData[]): TaskData[] => (
  [...tasks].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority
    if (a.position !== undefined && b.position !== undefined) return a.position - b.position
    if (a.position !== undefined && b.position === undefined) return -1
    if (a.position === undefined && b.position !== undefined) return 1
    return a.lastModificationDate.localeCompare(b.lastModificationDate)
  })
)

const resolveCurrentPath = (
  projects: ProjectData[],
  currentPath: TaskPath
): ResolvedCurrentPath => {
  if (isProjectList(currentPath)) {
    return { project: null, taskChain: [], currentTask: null }
  }

  const project = projects.find((candidate) => candidate.id === currentPath[0]) ?? null
  if (!project || isProject(currentPath)) {
    return { project, taskChain: [], currentTask: null }
  }

  const chain: TaskData[] = []
  let currentTasks = project.tasks
  for (const taskId of currentPath.slice(1)) {
    const task = currentTasks.find((t) => t.id === taskId)
    if (!task) return { project, taskChain: chain, currentTask: null }
    chain.push(task)
    currentTasks = task.subtasks
  }

  return { project, taskChain: chain, currentTask: chain.at(-1) ?? null }
}

const getTasksForResolvedPath = (
  project: ProjectData | null,
  currentTask: TaskData | null,
  currentPath: TaskPath,
  searchQuery: string,
  showCompleted: boolean
): TaskData[] => {
  if (!project) return []

  let tasks = isProject(currentPath) ? project.tasks : currentTask?.subtasks ?? []
  const normalizedSearch = searchQuery.trim().toLowerCase()
  if (normalizedSearch) {
    tasks = tasks.filter((task) => task.name.toLowerCase().includes(normalizedSearch))
  }

  if (currentTask?.isOrdered) {
    const sorted = sortByPriorityAndPosition(tasks)
    return showCompleted ? sorted : sorted.filter((task) => !task.completed)
  }

  if (!showCompleted) {
    return sortByPriorityAndPosition(tasks.filter((task) => !task.completed))
  }

  const completed = tasks
    .filter((task) => task.completed)
    .sort((a, b) => (a.completionDate || "").localeCompare(b.completionDate || ""))
  const incomplete = sortByPriorityAndPosition(tasks.filter((task) => !task.completed))
  return [...completed, ...incomplete]
}

const getOrderedNumberMapForTask = (currentTask: TaskData | null): Record<string, number> => {
  if (!currentTask?.isOrdered) return {}

  return Object.fromEntries(
    sortByPriorityAndPosition(currentTask.subtasks).map((task, index) => [task.id, index + 1])
  )
}

export const getCurrentTaskViewData = (
  projects: ProjectData[],
  currentPath: TaskPath,
  searchQuery: string,
  showCompleted: boolean
): CurrentTaskViewData => {
  const resolved = resolveCurrentPath(projects, currentPath)
  return {
    ...resolved,
    tasks: getTasksForResolvedPath(
      resolved.project,
      resolved.currentTask,
      currentPath,
      searchQuery,
      showCompleted
    ),
    orderedNumberMap: getOrderedNumberMapForTask(resolved.currentTask),
  }
}

export const getCurrentTasksForView = (
  projects: ProjectData[],
  currentPath: TaskPath,
  searchQuery: string,
  showCompleted: boolean
): TaskData[] => getCurrentTaskViewData(
  projects,
  currentPath,
  searchQuery,
  showCompleted
).tasks

export const getOrderedTaskNumberMap = (
  projects: ProjectData[],
  currentPath: TaskPath
): Record<string, number> => getOrderedNumberMapForTask(
  resolveCurrentPath(projects, currentPath).currentTask
)

export const getCurrentTaskChain = (
  projects: ProjectData[],
  currentPath: TaskPath
): TaskData[] => resolveCurrentPath(projects, currentPath).taskChain
