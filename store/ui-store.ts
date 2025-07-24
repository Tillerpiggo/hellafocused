import { create } from "zustand"
import { useAppStore } from "./app-store"
import { findTaskAtPath, findProjectAtPath, isProject } from "@/lib/task-utils"

interface UIDialogState {
  showTaskCompletionDialog: boolean
  pendingTaskCompletion: string[] | null
  showDeleteConfirmationDialog: boolean
  pendingDeletion: string[] | null
  isFocusMode: boolean
  focusStartPath: string[] | null
}

interface UIActions {
  attemptTaskCompletion: (taskPath: string[]) => void
  confirmTaskCompletion: () => void
  cancelTaskCompletion: () => void
  
  attemptDeletion: (itemPath: string[]) => void
  confirmDeletion: () => void
  cancelDeletion: () => void

  setFocusMode: (isFocusMode: boolean, startPath?: string[]) => void
}

export type UIState = UIDialogState & UIActions

export const useUIStore = create<UIState>((set, get) => ({
  // State
  showTaskCompletionDialog: false,
  pendingTaskCompletion: null,
  showDeleteConfirmationDialog: false,
  pendingDeletion: null,
  isFocusMode: false,
  focusStartPath: null,

  // Actions
  attemptTaskCompletion: (taskPath) => {
    const { projects, toggleTaskCompletion } = useAppStore.getState()
    const task = findTaskAtPath(projects, taskPath)
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
    const { projects, deleteAtPath } = useAppStore.getState()

    if (isProject(itemPath)) {
      // Deleting a project
      const project = findProjectAtPath(projects, itemPath)
      if (!project) return

      if (project.tasks.length > 0) {
        set({
          showDeleteConfirmationDialog: true,
          pendingDeletion: itemPath,
        })
      } else {
        deleteAtPath(itemPath)
      }
    } else {
      // Deleting a task
      const task = findTaskAtPath(projects, itemPath)
      if (!task) return

      if (task.subtasks.length > 0) {
        set({
          showDeleteConfirmationDialog: true,
          pendingDeletion: itemPath,
        })
      } else {
        deleteAtPath(itemPath)
      }
    }
  },

  confirmDeletion: () => {
    const { pendingDeletion } = get()
    if (!pendingDeletion) return

    const { deleteAtPath } = useAppStore.getState()
    deleteAtPath(pendingDeletion)

    set({
      showDeleteConfirmationDialog: false,
      pendingDeletion: null,
    })
  },

  cancelDeletion: () => set({
    showDeleteConfirmationDialog: false,
    pendingDeletion: null,
  }),

  setFocusMode: (isFocusMode, startPath) => set({ 
    isFocusMode,
    focusStartPath: isFocusMode ? startPath : null
  }),
})) 