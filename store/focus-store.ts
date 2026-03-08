import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProjectData, TaskData, FocusSession } from "@/lib/types"
import { produce } from "immer"
import { randomFrom } from "@/lib/utils"
import {
  findTaskAtPath,
  findProjectAtPath,
  getHierarchicalLeafNodes,
  findTaskPath,
  getProjectId,
  arePathsEqual,
} from "@/lib/task-utils"
import { useAppStore } from "./app-store"

interface FocusState {
  // Transient focus state (not persisted)
  focusModeProjectLeaves: TaskData[]
  currentFocusTask: TaskData | null
  focusStartPath: string[]
  showAddTasksView: boolean
  showSubtaskCelebration: boolean
  lastFocusedTaskId: string | null

  // Session state (persisted)
  sessions: FocusSession[]
  activeSessionId: string | null

  // Actions
  initializeFocus: (projects: ProjectData[], startPath: string[]) => void
  resetFocus: () => void
  getNextFocusTask: () => void
  completeFocusTask: () => void
  setShowAddTasksView: (show: boolean) => void
  updateFocusLeaves: (projects: ProjectData[]) => void

  // Session actions
  createOrResumeSession: (projects: ProjectData[], startPath: string[]) => void
  switchSession: (sessionId: string, projects: ProjectData[]) => void
  removeSession: (sessionId: string) => void
  saveCurrentSessionState: () => void

  // Timer actions
  setTimer: (sessionId: string, durationMs: number) => void
  clearTimer: (sessionId: string) => void
  clearTimerFired: (sessionId: string) => void
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      // Initial state
      focusModeProjectLeaves: [],
      currentFocusTask: null,
      focusStartPath: [],
      showAddTasksView: false,
      showSubtaskCelebration: false,
      lastFocusedTaskId: null,

      // Session state
      sessions: [],
      activeSessionId: null,

      createOrResumeSession: (projects, startPath) => {
        const { sessions } = get()
        const existing = sessions.find(s => arePathsEqual(s.startPath, startPath))

        if (existing) {
          get().switchSession(existing.id, projects)
          return
        }

        const newSession: FocusSession = {
          id: crypto.randomUUID(),
          startPath,
          currentFocusTaskId: null,
          completedCount: 0,
          createdAt: Date.now(),
        }

        set({ sessions: [...sessions, newSession], activeSessionId: newSession.id })
        get().initializeFocus(projects, startPath)
      },

      switchSession: (sessionId, projects) => {
        const { sessions, activeSessionId } = get()
        if (sessionId === activeSessionId) return

        // Save current session state first
        get().saveCurrentSessionState()

        const target = sessions.find(s => s.id === sessionId)
        if (!target) return

        // Validate the session's root still exists
        const projectId = getProjectId(target.startPath)
        if (!projectId) return
        const project = projects.find(p => p.id === projectId)
        if (!project) return
        if (target.startPath.length > 1) {
          const task = findTaskAtPath(projects, target.startPath)
          if (!task) return
        }

        set({
          activeSessionId: sessionId,
          currentFocusTask: null,
          showAddTasksView: false,
          showSubtaskCelebration: false,
          lastFocusedTaskId: target.currentFocusTaskId,
        })
        get().initializeFocus(projects, target.startPath)
      },

      removeSession: (sessionId) => {
        const { sessions, activeSessionId } = get()
        const updated = sessions.filter(s => s.id !== sessionId)

        if (sessionId === activeSessionId) {
          if (updated.length > 0) {
            // Switch to most recently created remaining session
            const mostRecent = updated.reduce((a, b) => a.createdAt > b.createdAt ? a : b)
            set({ sessions: updated, activeSessionId: mostRecent.id })
            const projects = useAppStore.getState().projects
            get().switchSession(mostRecent.id, projects)
          } else {
            set({
              sessions: [],
              activeSessionId: null,
            })
          }
        } else {
          set({ sessions: updated })
        }
      },

      saveCurrentSessionState: () => {
        const { activeSessionId, currentFocusTask, sessions } = get()
        if (!activeSessionId) return

        const updated = sessions.map(s =>
          s.id === activeSessionId
            ? { ...s, currentFocusTaskId: currentFocusTask?.id || null }
            : s
        )
        set({ sessions: updated })
      },

      updateFocusLeaves: (projects) => {
        const { focusStartPath, currentFocusTask } = get()

        const { leaves: newLeaves, updatedPath } = getHierarchicalLeafNodes(projects, focusStartPath)

        if (!arePathsEqual(updatedPath, focusStartPath)) {
          set({ focusStartPath: updatedPath })
        }

        if (currentFocusTask) {
          const currentProjectId = getProjectId(focusStartPath)
          if (currentProjectId) {
            const project = projects.find((p) => p.id === currentProjectId)
            if (project) {
              const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
              if (taskPathInProject) {
                const fullTaskPath = [currentProjectId, ...taskPathInProject]
                const currentTaskInProjects = findTaskAtPath(projects, fullTaskPath)
                const currentTaskHasSubtasks = currentTaskInProjects?.subtasks?.filter(st => !st.completed).length ?? 0 > 0
                if (currentTaskHasSubtasks) {
                  const newFocusPath = fullTaskPath
                  const { leaves: newLeavesForTask, updatedPath } = getHierarchicalLeafNodes(projects, newFocusPath)

                  set({
                    focusStartPath: updatedPath,
                    focusModeProjectLeaves: newLeavesForTask,
                  })
                  return
                }
              }
            }
          }
        }

        set({
          focusModeProjectLeaves: newLeaves,
        })
      },

      initializeFocus: (projects, startPath) => {
        const projectId = getProjectId(startPath)
        if (!projectId) return

        const project = projects.find((p) => p.id === projectId)
        if (!project) return

        const { leaves, updatedPath } = getHierarchicalLeafNodes(projects, startPath)

        const { focusStartPath: currentStartPath } = get()
        const scopeChanged = !arePathsEqual(currentStartPath, startPath)

        set({
          focusStartPath: updatedPath,
          focusModeProjectLeaves: leaves,
          lastFocusedTaskId: scopeChanged ? null : get().lastFocusedTaskId,
        })
      },

      resetFocus: () => {
        get().saveCurrentSessionState()
        set({
          focusModeProjectLeaves: [],
          currentFocusTask: null,
          focusStartPath: [],
          showAddTasksView: false,
          lastFocusedTaskId: null,
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

          const getHierarchicalPriority = (leafTask: TaskData): number[] => {
            const taskPathInProject = findTaskPath(project.tasks, leafTask.id)
            if (!taskPathInProject) return [leafTask.priority]

            const focusTaskPath = focusStartPath.slice(1)

            if (taskPathInProject.length < focusTaskPath.length) {
              throw new Error(`Task ${leafTask.id} is not a descendant of focus path`)
            }

            for (let i = 0; i < focusTaskPath.length; i++) {
              if (taskPathInProject[i] !== focusTaskPath[i]) {
                throw new Error(`Task ${leafTask.id} is not a descendant of focus path`)
              }
            }

            const relativePath = taskPathInProject.slice(focusTaskPath.length)
            const priorityArray: number[] = []

            let currentTasks: TaskData[]
            if (focusTaskPath.length === 0) {
              currentTasks = project.tasks
            } else {
              const focusTask = findTaskAtPath(projects, focusStartPath)
              currentTasks = focusTask?.subtasks || []
            }

            for (const taskId of relativePath) {
              const task = currentTasks.find(t => t.id === taskId)
              if (task) {
                priorityArray.push(task.priority)
                currentTasks = task.subtasks
              } else {
                break
              }
            }

            return priorityArray
          }

          const sortedLeaves = availableLeaves.sort((a, b) => {
            const priorityA = getHierarchicalPriority(a)
            const priorityB = getHierarchicalPriority(b)

            const maxLength = Math.max(priorityA.length, priorityB.length)
            for (let i = 0; i < maxLength; i++) {
              const valA = priorityA[i] ?? 0
              const valB = priorityB[i] ?? 0
              if (valA !== valB) {
                return valB - valA
              }
            }
            return 0
          })

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

        if (currentFocusTask && currentProjectId) {
          const projects = useAppStore.getState().projects
          const project = projects.find((p) => p.id === currentProjectId)
          if (project) {
            const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
            if (taskPathInProject) {
              const fullTaskPath = [currentProjectId, ...taskPathInProject]

              if (fullTaskPath.length > 2) {
                const parentPath = fullTaskPath.slice(0, -1)
                const parentTask = findTaskAtPath(projects, parentPath)

                if (parentTask && parentTask.subtasks) {
                  const allSubtasksWillBeCompleted = parentTask.subtasks.every(subtask =>
                    subtask.id === currentFocusTask.id || subtask.completed
                  )

                  if (allSubtasksWillBeCompleted) {
                    set({ showSubtaskCelebration: true })
                  }
                }
              }

              useAppStore.getState().toggleTaskCompletion(fullTaskPath)
            }
          }

          set(
            produce((draft: FocusState) => {
              if (draft.currentFocusTask) {
                const taskInLeaves = draft.focusModeProjectLeaves.find((t) => t.id === draft.currentFocusTask!.id)
                if (taskInLeaves) taskInLeaves.completed = true
              }
            }),
          )

          const updatedProjects = useAppStore.getState().projects
          get().updateFocusLeaves(updatedProjects)

          // Increment completed count and save
          const { activeSessionId, sessions } = get()
          if (activeSessionId) {
            set({
              sessions: sessions.map(s =>
                s.id === activeSessionId
                  ? { ...s, completedCount: s.completedCount + 1 }
                  : s
              )
            })
          }
          get().saveCurrentSessionState()
        }
      },

      setTimer: (sessionId, durationMs) => {
        set({
          sessions: get().sessions.map(s =>
            s.id === sessionId
              ? { ...s, timerEndTime: Date.now() + durationMs, timerFired: false }
              : s
          ),
        })
      },

      clearTimer: (sessionId) => {
        set({
          sessions: get().sessions.map(s =>
            s.id === sessionId
              ? { ...s, timerEndTime: null, timerFired: false }
              : s
          ),
        })
      },

      clearTimerFired: (sessionId) => {
        set({
          sessions: get().sessions.map(s =>
            s.id === sessionId ? { ...s, timerFired: false } : s
          ),
        })
      },

      setShowAddTasksView: (show) => {
        set({ showAddTasksView: show })

        if (!show) {
          const projects = useAppStore.getState().projects
          const { currentFocusTask, focusStartPath } = get()

          if (currentFocusTask) {
            const currentProjectId = getProjectId(focusStartPath)
            if (currentProjectId) {
              const project = projects.find((p) => p.id === currentProjectId)
              if (project) {
                const taskPathInProject = findTaskPath(project.tasks, currentFocusTask.id)
                if (taskPathInProject) {
                  const fullTaskPath = [currentProjectId, ...taskPathInProject]
                  const currentTaskInProjects = findTaskAtPath(projects, fullTaskPath)
                  const currentTaskHasSubtasks = currentTaskInProjects?.subtasks?.filter(st => !st.completed).length ?? 0 > 0

                  if (currentTaskHasSubtasks) {
                    const newFocusPath = fullTaskPath
                    const { leaves: newLeavesForTask, updatedPath } = getHierarchicalLeafNodes(projects, newFocusPath)

                    set({
                      focusStartPath: updatedPath,
                      focusModeProjectLeaves: newLeavesForTask,
                      currentFocusTask: randomFrom(newLeavesForTask),
                    })
                    return
                  }
                }
              }
            }
          }

          get().updateFocusLeaves(projects)

          const { currentFocusTask: updatedCurrentTask, focusModeProjectLeaves } = get()
          if (!updatedCurrentTask && focusModeProjectLeaves.length > 0) {
            const availableLeaves = focusModeProjectLeaves.filter(leaf => !leaf.completed)
            if (availableLeaves.length > 0) {
              set({ currentFocusTask: randomFrom(availableLeaves) })
            }
          }
        }
      },
    }),
    {
      name: "focus-sessions",
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const now = Date.now()
        let changed = false
        const updated = state.sessions.map(s => {
          if (s.timerEndTime && s.timerEndTime <= now && !s.timerFired) {
            changed = true
            return { ...s, timerFired: true, timerEndTime: null }
          }
          return s
        })
        if (changed) {
          useFocusStore.setState({ sessions: updated })
        }
      },
    }
  )
)

export function canShuffleCurrentTask(state: FocusState): boolean {
  const { focusModeProjectLeaves, currentFocusTask } = state
  if (!currentFocusTask) return false
  const available = focusModeProjectLeaves.filter(
    (leaf) => leaf.id !== currentFocusTask.id && !leaf.completed,
  )
  return available.length > 0
}

export function getActiveSessionTimer(state: FocusState) {
  const session = state.sessions.find(s => s.id === state.activeSessionId)
  if (!session) return null
  if (!session.timerEndTime && !session.timerFired) return null
  return { timerEndTime: session.timerEndTime ?? null, timerFired: session.timerFired ?? false }
}

export function hasAnyFiredTimer(state: FocusState) {
  return state.sessions.some(s => s.timerFired === true)
}
