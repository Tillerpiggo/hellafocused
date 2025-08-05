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
  showSubtaskCelebration: boolean
  lastFocusedTaskId: string | null
  
  // Actions
  initializeFocus: (projects: ProjectData[], startPath: string[]) => void
  resetFocus: () => void
  getNextFocusTask: () => void
  completeFocusTask: () => void
  setShowAddTasksView: (show: boolean) => void
  updateFocusLeaves: (projects: ProjectData[]) => void
}

export const useFocusStore = create<FocusState>((set, get) => ({
  // Initial state
  focusModeProjectLeaves: [],
  currentFocusTask: null,
  focusStartPath: [],
  showAddTasksView: false,
  showSubtaskCelebration: false,
  lastFocusedTaskId: null,

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
    
    // Check if focus scope has changed
    const { focusStartPath: currentStartPath } = get()
    const scopeChanged = JSON.stringify(currentStartPath) !== JSON.stringify(startPath)
    
    set({
      focusStartPath: startPath,
      focusModeProjectLeaves: leaves,
      lastFocusedTaskId: scopeChanged ? null : get().lastFocusedTaskId,
    })
  },

  resetFocus: () => {
    const { currentFocusTask } = get()
    set({
      focusModeProjectLeaves: [],
      currentFocusTask: null,
      focusStartPath: [],
      showAddTasksView: false,
      lastFocusedTaskId: currentFocusTask?.id || null,
    })
  },

  getNextFocusTask: () => {
    set((state) => {
      const { focusStartPath } = state
      const projectId = getProjectId(focusStartPath)
      if (!projectId) return { currentFocusTask: null }
      
      const projects = useAppStore.getState().projects
      const project = projects.find((p) => p.id === projectId)
      if (!project) return { currentFocusTask: null }
      
      const availableLeaves = state.focusModeProjectLeaves.filter(
        (leaf) => leaf.id !== state.currentFocusTask?.id && !leaf.completed,
      )
      
      // Get hierarchical priority for each leaf task
      const getHierarchicalPriority = (leafTask: TaskData): number[] => {
        const taskPathInProject = findTaskPath(project.tasks, leafTask.id)
        if (!taskPathInProject) return [leafTask.priority]
        
        const focusTaskPath = focusStartPath.slice(1) // Remove project ID
        
        // Verify taskPathInProject starts with focusTaskPath
        if (taskPathInProject.length < focusTaskPath.length) {
          throw new Error(`Task ${leafTask.id} is not a descendant of focus path`)
        }
        
        for (let i = 0; i < focusTaskPath.length; i++) {
          if (taskPathInProject[i] !== focusTaskPath[i]) {
            throw new Error(`Task ${leafTask.id} is not a descendant of focus path`)
          }
        }
        
        // Get relative path from focus level down
        const relativePath = taskPathInProject.slice(focusTaskPath.length)
        
        // Build priority array for each level in the relative path
        const priorityArray: number[] = []
        
        // Start with tasks at the focus level
        let currentTasks: TaskData[]
        if (focusTaskPath.length === 0) {
          currentTasks = project.tasks
        } else {
          const focusTask = findTaskAtPath(projects, focusStartPath)
          currentTasks = focusTask?.subtasks || []
        }
        
        // Walk down the task tree directly
        for (const taskId of relativePath) {
          const task = currentTasks.find(t => t.id === taskId)
          if (task) {
            priorityArray.push(task.priority)
            currentTasks = task.subtasks // Move down to next level
          } else {
            break // Task not found, shouldn't happen
          }
        }
        
        return priorityArray
      }
      
      // Sort tasks by hierarchical priority (lexicographic comparison)
      const sortedLeaves = availableLeaves.sort((a, b) => {
        const priorityA = getHierarchicalPriority(a)
        const priorityB = getHierarchicalPriority(b)
        
        // Lexicographic comparison (higher priority values come first)
        const maxLength = Math.max(priorityA.length, priorityB.length)
        for (let i = 0; i < maxLength; i++) {
          const valA = priorityA[i] ?? 0
          const valB = priorityB[i] ?? 0
          if (valA !== valB) {
            return valB - valA // Higher priority first
          }
        }
        return 0
      })
      
      // Select random task from the highest priority group
      if (sortedLeaves.length > 0) {
        const highestPriority = getHierarchicalPriority(sortedLeaves[0])
        const highestPriorityTasks = sortedLeaves.filter(task => {
          const taskPriority = getHierarchicalPriority(task)
          return JSON.stringify(taskPriority) === JSON.stringify(highestPriority)
        })
        
        return { currentFocusTask: randomFrom(highestPriorityTasks) }
      }
      
      return { currentFocusTask: null }
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
          
          // Check if completing this task means all subtasks of parent are complete
          if (fullTaskPath.length > 2) { // Has a parent (not root level)
            const parentPath = fullTaskPath.slice(0, -1)
            const parentTask = findTaskAtPath(projects, parentPath)
            
            if (parentTask && parentTask.subtasks) {
              // Check if all subtasks will be completed after this completion
              const allSubtasksWillBeCompleted = parentTask.subtasks.every(subtask => 
                subtask.id === currentFocusTask.id || subtask.completed
              )
              
              if (allSubtasksWillBeCompleted) {
                set({ showSubtaskCelebration: true })
              }
            }
          }
          
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