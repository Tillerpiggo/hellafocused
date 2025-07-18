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
    
    console.log('🔄 updateFocusLeaves called with current task:', currentFocusTask?.name)
    
    // Recalculate leaves based on current focus path
    const newLeaves = getHierarchicalLeafNodes(projects, focusStartPath)
    console.log('📋 Recalculated leaves:', newLeaves.map(l => l.name))
    
    // Check if current focus task now has subtasks (i.e., it's no longer a leaf)
    if (currentFocusTask) {
      const currentProjectId = getProjectId(focusStartPath)
      if (currentProjectId) {
        const project = projects.find((p) => p.id === currentProjectId)
        if (project) {
          // Find the correct path to the current focus task
          const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
          if (taskPathInProject) {
            const fullTaskPath = [currentProjectId, ...taskPathInProject]
            const currentTaskInProjects = findTaskAtPath(projects, fullTaskPath)
            const currentTaskHasSubtasks = currentTaskInProjects?.subtasks?.filter(st => !st.completed).length ?? 0 > 0
            if (currentTaskHasSubtasks) {
              console.log('🔀 Current task now has subtasks, refocusing on task children')
              // The task now has incomplete subtasks, so refocus on this task
              const newFocusPath = fullTaskPath
              const newLeavesForTask = getHierarchicalLeafNodes(projects, newFocusPath)
              
              console.log('📋 New leaves for refocused task:', newLeavesForTask.map(l => l.name))
              
              set({
                focusStartPath: newFocusPath,
                focusModeProjectLeaves: newLeavesForTask,
              })
              return
            }
          }
        }
      }
    }
    
    console.log('✅ Just updating leaves, no currentFocusTask change')
    // Just update the leaves - never change currentFocusTask
    set({
      focusModeProjectLeaves: newLeaves,
    })
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
    console.log('🎯 getNextFocusTask called')
    // Update leaves first to get the latest data
    const projects = useAppStore.getState().projects
    get().updateFocusLeaves(projects)
    
    // Then pick next task from updated leaves
    set((state) => {
      const availableLeaves = state.focusModeProjectLeaves.filter(
        (leaf) => leaf.id !== state.currentFocusTask?.id && !leaf.completed,
      )
      console.log('🎲 Available leaves for next task:', availableLeaves.map(l => l.name))
      
      // Pick a random task from the available leaves
      if (availableLeaves.length > 0) {
        const nextTask = randomFrom(availableLeaves)
        console.log('✨ Selected next task:', nextTask?.name)
        return { currentFocusTask: nextTask }
      }
      // If current task was the last one, or all are completed
      const allLeaves = state.focusModeProjectLeaves.filter((leaf) => !leaf.completed)
      console.log('🔄 No other available leaves, picking from all incomplete:', allLeaves.map(l => l.name))
      const nextTask = randomFrom(allLeaves)
      console.log('✨ Selected next task (from all):', nextTask?.name)
      return { currentFocusTask: nextTask }
    })
  },

  completeFocusTask: () => {
    const { currentFocusTask, focusStartPath } = get()
    const currentProjectId = getProjectId(focusStartPath)
    
    console.log('✅ completeFocusTask called for task:', currentFocusTask?.name)
    
    if (currentFocusTask && currentProjectId) {
      // Find the path to the currentFocusTask to mark it completed in the main projects data
      const projects = useAppStore.getState().projects
      const project = projects.find((p) => p.id === currentProjectId)
      if (project) {
        const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
        if (taskPathInProject) {
          const fullTaskPath = [currentProjectId, ...taskPathInProject]
          
          console.log('📝 Marking task as completed in app store')
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
      
      console.log('🔄 Calling updateFocusLeaves after completion')
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
    console.log('🎛️ setShowAddTasksView called with:', show)
    set({ showAddTasksView: show })
    
    // When dismissing add-tasks-view, update leaves to sync with latest data
    if (!show) {
      const projects = useAppStore.getState().projects
      const { currentFocusTask, focusStartPath } = get()
      
      // Check if the current focus task now has subtasks (i.e., it's no longer a leaf)
      if (currentFocusTask) {
        const currentProjectId = getProjectId(focusStartPath)
        if (currentProjectId) {
          const project = projects.find((p) => p.id === currentProjectId)
          if (project) {
            // Find the correct path to the current focus task
            const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
            if (taskPathInProject) {
              const fullTaskPath = [currentProjectId, ...taskPathInProject]
              const currentTaskInProjects = findTaskAtPath(projects, fullTaskPath)
              const currentTaskHasSubtasks = currentTaskInProjects?.subtasks?.filter(st => !st.completed).length ?? 0 > 0
              
              if (currentTaskHasSubtasks) {
                // The task now has incomplete subtasks, so refocus on this task's children
                const newFocusPath = fullTaskPath
                const newLeavesForTask = getHierarchicalLeafNodes(projects, newFocusPath)
                
                set({
                  focusStartPath: newFocusPath,
                  focusModeProjectLeaves: newLeavesForTask,
                  currentFocusTask: randomFrom(newLeavesForTask),
                })
                return
              }
            }
          }
        }
      }
      
      // If no refocusing happened, just update leaves normally
      get().updateFocusLeaves(projects)
      
      // If there's no current task but there are available leaves, pick one
      const { currentFocusTask: updatedCurrentTask, focusModeProjectLeaves } = get()
      if (!updatedCurrentTask && focusModeProjectLeaves.length > 0) {
        const availableLeaves = focusModeProjectLeaves.filter(leaf => !leaf.completed)
        if (availableLeaves.length > 0) {
          set({ currentFocusTask: randomFrom(availableLeaves) })
        }
      }
    }
  },
})) 