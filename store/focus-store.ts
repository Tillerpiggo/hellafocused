import { create } from "zustand"
import type { ProjectData, TaskItemData } from "@/lib/types"
import { produce } from "immer"
import { triggerConfetti } from "@/lib/confetti"
import { randomFrom } from "@/lib/utils"
import {
  findTaskByPath,
  updateTaskByPath,
  markAllSubtasksCompleted,
  getHierarchicalLeafNodes,
  findTaskPath,
  getProjectId,
  isProject,
} from "@/lib/task-utils"

interface FocusState {
  // Focus-specific state
  focusModeProjectLeaves: TaskItemData[]
  currentFocusTask: TaskItemData | null
  focusStartPath: string[]
  showAddTasksView: boolean
  
  // Actions
  initializeFocus: (projects: ProjectData[], startPath: string[]) => void
  resetFocus: () => void
  getNextFocusTask: () => void
  completeFocusTask: (projects: ProjectData[], onProjectsUpdate: (projects: ProjectData[]) => void) => void
  keepGoingFocus: (projects: ProjectData[]) => void
  setShowAddTasksView: (show: boolean) => void
}

export const useFocusStore = create<FocusState>((set, get) => ({
  // Initial state
  focusModeProjectLeaves: [],
  currentFocusTask: null,
  focusStartPath: [],
  showAddTasksView: false,

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

  getNextFocusTask: () =>
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
    }),

  completeFocusTask: (projects, onProjectsUpdate) => {
    const { currentFocusTask, focusStartPath } = get()
    const currentProjectId = getProjectId(focusStartPath)
    
    if (currentFocusTask && currentProjectId) {
      // Trigger confetti for task completion
      triggerConfetti()

      // Find the path to the currentFocusTask to mark it completed in the main projects data
      const project = projects.find((p) => p.id === currentProjectId)
      if (project) {
        const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
        if (taskPathInProject) {
          const fullTaskPath = [currentProjectId, ...taskPathInProject]
          
          // Update projects data
          const updatedProjects = produce(projects, (draft) => {
            updateTaskByPath(draft, fullTaskPath, (task) => {
              task.completed = true
              task.completedAt = new Date().toISOString()
              markAllSubtasksCompleted(task)
            })
          })
          
          // Notify the parent about the update
          onProjectsUpdate(updatedProjects)
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

  setShowAddTasksView: (show) => set({ showAddTasksView: show }),
})) 