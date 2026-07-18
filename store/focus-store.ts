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
import {
  trackFocusSessionCreated,
  trackFocusSessionDeleted,
  trackFocusSessionUpdated,
} from "@/lib/sync-bridge"

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
  createSession: (projects: ProjectData[], startPath: string[]) => string
  createBrowseSession: () => string
  createOrResumeSession: (projects: ProjectData[], startPath: string[]) => void
  switchSession: (sessionId: string, projects: ProjectData[]) => void
  removeSession: (sessionId: string) => void
  reorderSessions: (fromIndex: number, toIndex: number) => void
  duplicateSession: (fromIndex: number, toIndex: number) => string | null
  renameSession: (sessionId: string, name: string) => void
  setSessionView: (sessionId: string, view: 'focus' | 'browse') => void
  setSessionBrowsePath: (sessionId: string, path: string[]) => void
  setSessionScope: (sessionId: string, projects: ProjectData[], path: string[]) => void
  saveCurrentSessionState: () => void

  // Timer actions
  setTimer: (sessionId: string, durationMs: number) => void
  clearTimer: (sessionId: string) => void
  fireTimer: (sessionId: string) => void
  clearTimerFired: (sessionId: string) => void
}

function getSessionName(projects: ProjectData[], path: string[]): string {
  if (path.length === 0) return "Focus session"
  if (path.length === 1) {
    return projects.find(project => project.id === path[0])?.name || "Focus session"
  }
  return findTaskAtPath(projects, path)?.name || "Focus session"
}

function normalizeSession(session: Partial<FocusSession>, index: number): FocusSession {
  const createdAt = session.createdAt ?? Date.now()
  return {
    id: session.id || crypto.randomUUID(),
    name: session.name || "Focus session",
    startPath: session.startPath || [],
    browsePath: session.browsePath || session.startPath || [],
    view: session.view || 'focus',
    currentFocusTaskId: session.currentFocusTaskId ?? null,
    completedCount: session.completedCount ?? 0,
    createdAt,
    updatedAt: session.updatedAt || new Date(createdAt).toISOString(),
    position: session.position ?? index,
    timerEndTime: session.timerEndTime ?? null,
    timerFired: session.timerFired ?? false,
  }
}

function updateAndTrackSession(
  set: (partial: Partial<FocusState>) => void,
  get: () => FocusState,
  sessionId: string,
  update: (session: FocusSession) => FocusSession,
) {
  const current = get().sessions.find(session => session.id === sessionId)
  if (!current) return
  const next = { ...update(current), updatedAt: new Date().toISOString() }
  set({ sessions: get().sessions.map(session => session.id === sessionId ? next : session) })
  trackFocusSessionUpdated(next)
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

      createSession: (projects, startPath) => {
        const { sessions } = get()
        const now = Date.now()
        const newSession: FocusSession = {
          id: crypto.randomUUID(),
          name: getSessionName(projects, startPath),
          startPath: [...startPath],
          browsePath: [...startPath],
          view: 'focus',
          currentFocusTaskId: null,
          completedCount: 0,
          createdAt: now,
          updatedAt: new Date(now).toISOString(),
          position: sessions.length,
          timerEndTime: null,
          timerFired: false,
        }

        set({ sessions: [...sessions, newSession], activeSessionId: newSession.id })
        get().initializeFocus(projects, startPath)
        trackFocusSessionCreated(newSession)
        return newSession.id
      },

      // Born unscoped from the sidebar: opens at the project list in browse
      // view and gains its startPath on the first "Focus here".
      createBrowseSession: () => {
        const { sessions } = get()
        const now = Date.now()
        const newSession: FocusSession = {
          id: crypto.randomUUID(),
          name: "Focus session",
          startPath: [],
          browsePath: [],
          view: 'browse',
          currentFocusTaskId: null,
          completedCount: 0,
          createdAt: now,
          updatedAt: new Date(now).toISOString(),
          position: sessions.length,
          timerEndTime: null,
          timerFired: false,
        }

        get().saveCurrentSessionState()
        set({
          sessions: [...sessions, newSession],
          activeSessionId: newSession.id,
          currentFocusTask: null,
          showAddTasksView: false,
          showSubtaskCelebration: false,
          lastFocusedTaskId: null,
          focusModeProjectLeaves: [],
          focusStartPath: [],
        })
        trackFocusSessionCreated(newSession)
        return newSession.id
      },

      // Kept as a compatibility alias. Focus now always creates a new workspace.
      createOrResumeSession: (projects, startPath) => {
        get().createSession(projects, startPath)
      },

      switchSession: (sessionId, projects) => {
        const { sessions, activeSessionId } = get()
        if (sessionId === activeSessionId) return

        // Save current session state first
        get().saveCurrentSessionState()

        const target = sessions.find(s => s.id === sessionId)
        if (!target) return

        // Unscoped sessions have no root to validate and no task pool to build
        if (target.startPath.length === 0) {
          set({
            activeSessionId: sessionId,
            currentFocusTask: null,
            showAddTasksView: false,
            showSubtaskCelebration: false,
            lastFocusedTaskId: null,
            focusModeProjectLeaves: [],
            focusStartPath: [],
          })
          return
        }

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
          set({
            sessions: updated,
            activeSessionId: null,
            focusModeProjectLeaves: [],
            currentFocusTask: null,
            focusStartPath: [],
          })
        } else {
          set({ sessions: updated })
        }
        trackFocusSessionDeleted(sessionId)
      },

      reorderSessions: (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return

        const orderedSessions = get().sessions
          .slice()
          .sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)

        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= orderedSessions.length ||
          toIndex >= orderedSessions.length
        ) return

        const [movedSession] = orderedSessions.splice(fromIndex, 1)
        orderedSessions.splice(toIndex, 0, movedSession)

        const updatedAt = new Date().toISOString()
        const changedSessions: FocusSession[] = []
        const reorderedSessions = orderedSessions.map((session, position) => {
          if (session.position === position) return session

          const updatedSession = { ...session, position, updatedAt }
          changedSessions.push(updatedSession)
          return updatedSession
        })

        set({ sessions: reorderedSessions })
        changedSessions.forEach(trackFocusSessionUpdated)
      },

      duplicateSession: (fromIndex, insertionIndex) => {
        const orderedSessions = get().sessions
          .slice()
          .sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)

        if (
          fromIndex < 0 ||
          insertionIndex < 0 ||
          fromIndex >= orderedSessions.length ||
          insertionIndex > orderedSessions.length
        ) return null

        const sourceSession = orderedSessions[fromIndex]
        const now = Date.now()
        const updatedAt = new Date(now).toISOString()
        const duplicatedSession: FocusSession = {
          ...sourceSession,
          id: crypto.randomUUID(),
          startPath: [...sourceSession.startPath],
          browsePath: [...sourceSession.browsePath],
          createdAt: now,
          updatedAt,
          position: insertionIndex,
          timerEndTime: null,
          timerFired: false,
        }

        orderedSessions.splice(insertionIndex, 0, duplicatedSession)

        const changedSessions: FocusSession[] = []
        const nextSessions = orderedSessions.map((session, position) => {
          if (session.id === duplicatedSession.id) {
            return { ...session, position }
          }
          if (session.position === position) return session

          const updatedSession = { ...session, position, updatedAt }
          changedSessions.push(updatedSession)
          return updatedSession
        })

        set({ sessions: nextSessions })
        trackFocusSessionCreated(nextSessions[insertionIndex])
        changedSessions.forEach(trackFocusSessionUpdated)
        return duplicatedSession.id
      },

      renameSession: (sessionId, name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        updateAndTrackSession(set, get, sessionId, session => ({ ...session, name: trimmed }))
      },

      setSessionView: (sessionId, view) => {
        updateAndTrackSession(set, get, sessionId, session => ({ ...session, view }))
      },

      setSessionBrowsePath: (sessionId, path) => {
        updateAndTrackSession(set, get, sessionId, session => ({ ...session, browsePath: [...path] }))
      },

      setSessionScope: (sessionId, projects, path) => {
        updateAndTrackSession(set, get, sessionId, session => ({
          ...session,
          // Default-named sessions take their name from the first chosen scope
          name: session.name === "Focus session" ? getSessionName(projects, path) : session.name,
          startPath: [...path],
          browsePath: [...path],
          view: 'focus',
          currentFocusTaskId: null,
        }))
        if (get().activeSessionId === sessionId) {
          set({ currentFocusTask: null, lastFocusedTaskId: null })
          get().initializeFocus(projects, path)
        }
      },

      saveCurrentSessionState: () => {
        const { activeSessionId, currentFocusTask, sessions } = get()
        if (!activeSessionId) return

        const current = sessions.find(session => session.id === activeSessionId)
        const nextTaskId = currentFocusTask?.id || null
        if (!current || current.currentFocusTaskId === nextTaskId) return
        updateAndTrackSession(set, get, activeSessionId, session => ({
          ...session,
          currentFocusTaskId: nextTaskId,
        }))
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
        get().saveCurrentSessionState()
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
            updateAndTrackSession(set, get, activeSessionId, session => ({
              ...session,
              completedCount: session.completedCount + 1,
            }))
          }
          get().saveCurrentSessionState()
        }
      },

      setTimer: (sessionId, durationMs) => {
        updateAndTrackSession(set, get, sessionId, session => ({
          ...session,
          timerEndTime: Date.now() + durationMs,
          timerFired: false,
        }))
      },

      clearTimer: (sessionId) => {
        updateAndTrackSession(set, get, sessionId, session => ({
          ...session,
          timerEndTime: null,
          timerFired: false,
        }))
      },

      fireTimer: (sessionId) => {
        updateAndTrackSession(set, get, sessionId, session => ({
          ...session,
          timerEndTime: null,
          timerFired: true,
        }))
      },

      clearTimerFired: (sessionId) => {
        updateAndTrackSession(set, get, sessionId, session => ({ ...session, timerFired: false }))
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
        const updated = state.sessions.map((rawSession, index) => {
          const s = normalizeSession(rawSession, index)
          if (s !== rawSession) changed = true
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
