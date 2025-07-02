import { create } from "zustand"
import type { ProjectData, TaskData } from "@/lib/types"
import { produce } from "immer"
import { triggerConfetti } from "@/lib/confetti"
import { randomFrom } from "@/lib/utils"
import {
  findTaskAtPath,
  getHierarchicalLeafNodes,
  findTaskPath,
  getProjectId,
} from "@/lib/task-utils"
import { useAppStore } from "./app-store"

interface FocusState {
  // Focus-specific state
  focusModeProjectLeaves: TaskData[]
  currentFocusTask: TaskData | null
  focusStartPath: string[]
  showAddTasksView: boolean
  
  // Actions
  initializeFocus: (projects: ProjectData[], startPath: string[]) => void
  resetFocus: () => void
  getNextFocusTask: () => void
  completeFocusTask: () => void
  keepGoingFocus: (projects: ProjectData[]) => void
  setShowAddTasksView: (show: boolean) => void
  updateFocusLeaves: (projects: ProjectData[]) => void
}

export const useFocusStore = create<FocusState>((set, get) => ({
  // Initial state
  focusModeProjectLeaves: [],
  currentFocusTask: null,
  focusStartPath: [],
  showAddTasksView: false,

  updateFocusLeaves: (projects) => {
    const { focusStartPath, currentFocusTask } = get()
    
    // Recalculate leaves based on current focus path
    const newLeaves = getHierarchicalLeafNodes(projects, focusStartPath)
    
    // Check if current focus task is still valid
    if (currentFocusTask) {
      const isCurrentTaskInNewLeaves = newLeaves.some(leaf => leaf.id === currentFocusTask.id)
      
      if (!isCurrentTaskInNewLeaves) {
        // Check if the current task now has subtasks (i.e., it's no longer a leaf)
        const currentTaskInProjects = findTaskAtPath(projects, [...focusStartPath, currentFocusTask.id])
        const currentTaskHasSubtasks = currentTaskInProjects?.subtasks?.filter(st => !st.completed).length ?? 0 > 0
        if (currentTaskHasSubtasks) {
          // The task now has incomplete subtasks, so refocus on this task
          const newFocusPath = [...focusStartPath, currentFocusTask.id]
          const newLeavesForTask = getHierarchicalLeafNodes(projects, newFocusPath)
          
          set({
            focusStartPath: newFocusPath,
            focusModeProjectLeaves: newLeavesForTask,
            currentFocusTask: randomFrom(newLeavesForTask),
          })
          return
        }
        
        // Current task is not in leaves and doesn't have subtasks, pick a new random task
        set({
          focusModeProjectLeaves: newLeaves,
          currentFocusTask: newLeaves.length > 0 ? randomFrom(newLeaves) : null,
        })
      } else {
        // Current task is still valid, just update the leaves
        set({
          focusModeProjectLeaves: newLeaves,
        })
      }
    } else {
      // No current focus task, pick a new one
      set({
        focusModeProjectLeaves: newLeaves,
        currentFocusTask: newLeaves.length > 0 ? randomFrom(newLeaves) : null,
      })
    }
  },

  initializeFocus: (projects, startPath) => {
    const projectId = getProjectId(startPath)
    if (!projectId) return
    
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const leaves = getHierarchicalLeafNodes(projects, startPath)
    
    set({
      focusStartPath: startPath,
      focusModeProjectLeaves: leaves,
      currentFocusTask: randomFrom(leaves),   
    })
  },

  resetFocus: () => set({
    focusModeProjectLeaves: [],
    currentFocusTask: null,
    focusStartPath: [],
    showAddTasksView: false,
  }),

  getNextFocusTask: () => {
    // Update leaves first to get the latest data
    const projects = useAppStore.getState().projects
    get().updateFocusLeaves(projects)
    
    // Then pick next task from updated leaves
    set((state) => {
      const availableLeaves = state.focusModeProjectLeaves.filter(
        (leaf) => leaf.id !== state.currentFocusTask?.id && !leaf.completed,
      )
      // Pick a random task from the available leaves
      if (availableLeaves.length > 0) {
        return { currentFocusTask: randomFrom(availableLeaves) }
      }
      // If current task was the last one, or all are completed
      const allLeaves = state.focusModeProjectLeaves.filter((leaf) => !leaf.completed)
      return { currentFocusTask: randomFrom(allLeaves) }
    })
  },

  completeFocusTask: () => {
    const { currentFocusTask, focusStartPath } = get()
    const currentProjectId = getProjectId(focusStartPath)
    
    if (currentFocusTask && currentProjectId) {
      // Find the path to the currentFocusTask to mark it completed in the main projects data
      const projects = useAppStore.getState().projects
      const project = projects.find((p) => p.id === currentProjectId)
      if (project) {
        const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
        if (taskPathInProject) {
          const fullTaskPath = [currentProjectId, ...taskPathInProject]
          
          // Use the app store's toggleTaskCompletion function directly
          useAppStore.getState().toggleTaskCompletion(fullTaskPath)
        }
      }

      // Update focusModeProjectLeaves but DON'T get next task automatically
      set(
        produce((draft: FocusState) => {
          if (draft.currentFocusTask) {
            const taskInLeaves = draft.focusModeProjectLeaves.find((t) => t.id === draft.currentFocusTask!.id)
            if (taskInLeaves) taskInLeaves.completed = true
          }
        }),
      )
      
      // Update leaves after completion to sync with latest data
      const updatedProjects = useAppStore.getState().projects
      get().updateFocusLeaves(updatedProjects)
    }
  },

  keepGoingFocus: (projects) => {
    const { focusStartPath } = get()
    const currentProjectId = getProjectId(focusStartPath)
    if (!currentProjectId) return

    const project = projects.find((p) => p.id === currentProjectId)
    if (!project) return

    // If we were focusing at a specific task level, show the parent task
    if (focusStartPath.length > 1) {
      const parentTask = findTaskAtPath(projects, focusStartPath)
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
      const leaves = getHierarchicalLeafNodes(projects, parentPath)

      set({
        focusStartPath: parentPath,
        focusModeProjectLeaves: leaves,
        currentFocusTask: randomFrom(leaves),
      })
    } else {
      // We were at project level, pick a random project
      const availableProjects = projects.filter((p) => p.id !== currentProjectId)
      const randomProject = randomFrom(availableProjects)
      if (randomProject) {
        const leaves = getHierarchicalLeafNodes(projects, [randomProject.id])

        set({
          focusStartPath: [randomProject.id],
          focusModeProjectLeaves: leaves,
          currentFocusTask: randomFrom(leaves),
        })
      }
      // If no other projects, we'll let the parent component handle exiting focus mode
    }
  },

  setShowAddTasksView: (show) => {
    set({ showAddTasksView: show })
    
    // When dismissing add-tasks-view, update leaves to sync with latest data
    if (!show) {
      const projects = useAppStore.getState().projects
      get().updateFocusLeaves(projects)
    }
  },
})) 