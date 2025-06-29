import { create } from "zustand"
import { useAppStore } from "./app-store"
import { findTaskByPath, findProjectByPath, isProject } from "@/lib/task-utils"

interface ConfirmationDialogState {
  showTaskCompletionDialog: boolean
  pendingTaskCompletion: string[] | null
  showDeleteConfirmationDialog: boolean
  pendingDeletion: string[] | null
}

interface ConfirmationDialogActions {
  attemptTaskCompletion: (taskPath: string[]) => void
  confirmTaskCompletion: () => void
  cancelTaskCompletion: () => void
  
  attemptDeletion: (itemPath: string[]) => void
  confirmDeletion: () => void
  cancelDeletion: () => void
}

export type UIState = ConfirmationDialogState & ConfirmationDialogActions

export const useUIStore = create<UIState>((set, get) => ({
  // State
  showTaskCompletionDialog: false,
  pendingTaskCompletion: null,
  showDeleteConfirmationDialog: false,
  pendingDeletion: null,

  // Actions
  attemptTaskCompletion: (taskPath) => {
    const { projects, toggleTaskCompletion } = useAppStore.getState()
    const task = findTaskByPath(projects, taskPath)
    if (!task) return

    // Check if task has incomplete subtasks when completing
    const hasIncompleteSubtasks = task.subtasks.some((subtask) => !subtask.completed)

    if (!task.completed && hasIncompleteSubtasks) {
      // Show confirmation dialog
      set({
        showTaskCompletionDialog: true,
        pendingTaskCompletion: taskPath,
      })
    } else {
      // Proceed with completion directly
      toggleTaskCompletion(taskPath)
    }
  },

  confirmTaskCompletion: () => {
    const { pendingTaskCompletion } = get()
    if (!pendingTaskCompletion) return

    const { toggleTaskCompletion } = useAppStore.getState()
    toggleTaskCompletion(pendingTaskCompletion)
    
    set({
      showTaskCompletionDialog: false,
      pendingTaskCompletion: null,
    })
  },

  cancelTaskCompletion: () => set({
    showTaskCompletionDialog: false,
    pendingTaskCompletion: null,
  }),

  attemptDeletion: (itemPath) => {
    const { projects, deleteTask, deleteProject } = useAppStore.getState()

    if (isProject(itemPath)) {
      // Deleting a project
      const project = findProjectByPath(projects, itemPath)
      if (!project) return

      if (project.tasks.length > 0) {
        set({
          showDeleteConfirmationDialog: true,
          pendingDeletion: itemPath,
        })
      } else {
        deleteProject(itemPath[0])
      }
    } else {
      // Deleting a task
      const task = findTaskByPath(projects, itemPath)
      if (!task) return

      if (task.subtasks.length > 0) {
        set({
          showDeleteConfirmationDialog: true,
          pendingDeletion: itemPath,
        })
      } else {
        deleteTask(itemPath)
      }
    }
  },

  confirmDeletion: () => {
    const { pendingDeletion } = get()
    if (!pendingDeletion) return

    const { deleteTask, deleteProject } = useAppStore.getState()

    if (isProject(pendingDeletion)) {
      deleteProject(pendingDeletion[0])
    } else {
      deleteTask(pendingDeletion)
    }

    set({
      showDeleteConfirmationDialog: false,
      pendingDeletion: null,
    })
  },

  cancelDeletion: () => set({
    showDeleteConfirmationDialog: false,
    pendingDeletion: null,
  }),
})) 