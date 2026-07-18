import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProjectData, TaskData, FocusSession } from "@/lib/types"
import type { TaskPath } from "@/lib/task-path"
import { produce } from "immer"
import { randomFrom } from "@/lib/utils"
import {
  findTaskAtPath,
  getHierarchicalLeafNodes,
  indexTaskPaths,
  type IndexedTaskPath,
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
  currentFocusTaskPath: TaskPath | null
  focusStartPath: TaskPath
  showAddTasksView: boolean
  showSubtaskCelebration: boolean
  lastFocusedTaskId: string | null

  // Session state (persisted)
  sessions: FocusSession[]
  activeSessionId: string | null
  notepadOpen: boolean

  // Actions
  initializeFocus: (projects: ProjectData[], startPath: TaskPath) => void
  resetFocus: () => void
  getNextFocusTask: () => void
  setCurrentFocusTask: (task: TaskData | null, path?: TaskPath | null) => void
  completeFocusTask: () => void
  setShowAddTasksView: (show: boolean) => void
  setShowSubtaskCelebration: (show: boolean) => void
  updateFocusLeaves: (projects: ProjectData[]) => void
  refreshFocusLeaves: () => TaskData | null

  // Session actions
  createSession: (projects: ProjectData[], startPath: TaskPath, initialView?: FocusSession['view']) => string
  createBrowseSession: () => string
  createOrResumeSession: (projects: ProjectData[], startPath: TaskPath) => void
  switchSession: (sessionId: string, projects: ProjectData[]) => void
  removeSession: (sessionId: string, projects: ProjectData[]) => string | null
  reorderSessions: (fromIndex: number, toIndex: number) => void
  duplicateSession: (fromIndex: number, toIndex: number) => string | null
  renameSession: (sessionId: string, name: string) => void
  setSessionView: (sessionId: string, view: 'focus' | 'browse') => void
  setSessionBrowsePath: (sessionId: string, path: TaskPath) => void
  setSessionScope: (sessionId: string, projects: ProjectData[], path: TaskPath) => void
  setSessionNotes: (sessionId: string, notes: string) => void
  flushSessionNotesSync: (sessionId: string) => void
  setNotepadOpen: (open: boolean) => void
  saveCurrentSessionState: () => void

  // Pending actions
  markPending: (sessionId: string, remindInMs: number | null) => void
  resolvePending: (sessionId: string) => void
  setPendingReason: (sessionId: string, reason: string) => void
  fireReminder: (sessionId: string) => void
}

function getSessionName(projects: ProjectData[], path: TaskPath): string {
  if (path.length === 0) return "Focus session"
  if (path.length === 1) {
    return projects.find(project => project.id === path[0])?.name || "Focus session"
  }
  return findTaskAtPath(projects, path)?.name || "Focus session"
}

const sessionNotesSyncTimers = new Map<string, ReturnType<typeof setTimeout>>()

// Sessions persisted before the pending rework stored their reminder under timer fields
type LegacyTimerFields = { timerEndTime?: number | null; timerFired?: boolean }

function normalizeSession(session: Partial<FocusSession> & LegacyTimerFields, index: number): FocusSession {
  const createdAt = session.createdAt ?? Date.now()
  const remindAt = session.remindAt ?? session.timerEndTime ?? null
  const reminderFired = session.reminderFired ?? session.timerFired ?? false
  return {
    id: session.id || crypto.randomUUID(),
    name: session.name || "Focus session",
    startPath: session.startPath || [],
    browsePath: session.browsePath || session.startPath || [],
    view: session.view || 'focus',
    currentFocusTaskId: session.currentFocusTaskId ?? null,
    completedCount: session.completedCount ?? 0,
    notes: session.notes ?? "",
    createdAt,
    updatedAt: session.updatedAt || new Date(createdAt).toISOString(),
    position: session.position ?? index,
    pending: session.pending ?? (remindAt !== null || reminderFired),
    pendingReason: session.pendingReason ?? "",
    remindAt,
    reminderFired,
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
      currentFocusTaskPath: null,
      focusStartPath: [],
      showAddTasksView: false,
      showSubtaskCelebration: false,
      lastFocusedTaskId: null,

      // Session state
      sessions: [],
      activeSessionId: null,
      notepadOpen: false,

      createSession: (projects, startPath, initialView = 'focus') => {
        const { sessions } = get()
        const now = Date.now()
        const newSession: FocusSession = {
          id: crypto.randomUUID(),
          name: getSessionName(projects, startPath),
          startPath: [...startPath],
          browsePath: [...startPath],
          view: initialView,
          currentFocusTaskId: null,
          completedCount: 0,
          notes: "",
          createdAt: now,
          updatedAt: new Date(now).toISOString(),
          position: sessions.reduce((max, session) => Math.max(max, session.position), -1) + 1,
          pending: false,
          pendingReason: "",
          remindAt: null,
          reminderFired: false,
        }

        get().saveCurrentSessionState()
        set({
          sessions: [...sessions, newSession],
          activeSessionId: newSession.id,
          currentFocusTask: null,
          currentFocusTaskPath: null,
          lastFocusedTaskId: null,
          showAddTasksView: false,
          showSubtaskCelebration: false,
        })
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
          notes: "",
          createdAt: now,
          updatedAt: new Date(now).toISOString(),
          position: sessions.reduce((max, session) => Math.max(max, session.position), -1) + 1,
          pending: false,
          pendingReason: "",
          remindAt: null,
          reminderFired: false,
        }

        get().saveCurrentSessionState()
        set({
          sessions: [...sessions, newSession],
          activeSessionId: newSession.id,
          currentFocusTask: null,
          currentFocusTaskPath: null,
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
            currentFocusTaskPath: null,
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
          currentFocusTaskPath: null,
          showAddTasksView: false,
          showSubtaskCelebration: false,
          lastFocusedTaskId: target.currentFocusTaskId,
        })
        get().initializeFocus(projects, target.startPath)
      },

      removeSession: (sessionId, projects) => {
        const { sessions, activeSessionId } = get()
        const orderedSessions = sessions
          .slice()
          .sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)
        const removedIndex = orderedSessions.findIndex(session => session.id === sessionId)
        const updated = sessions.filter(s => s.id !== sessionId)

        if (sessionId === activeSessionId) {
          const replacement = removedIndex === -1
            ? null
            : orderedSessions[removedIndex - 1] ?? orderedSessions[removedIndex + 1] ?? null

          set({
            sessions: updated,
            activeSessionId: replacement?.id ?? null,
            focusModeProjectLeaves: [],
            currentFocusTask: null,
            currentFocusTaskPath: null,
            focusStartPath: [],
            showAddTasksView: false,
            showSubtaskCelebration: false,
            lastFocusedTaskId: replacement?.currentFocusTaskId ?? null,
          })

          if (replacement) get().initializeFocus(projects, replacement.startPath)
        } else {
          set({ sessions: updated })
        }
        trackFocusSessionDeleted(sessionId)
        return get().activeSessionId
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
          pending: false,
          pendingReason: "",
          remindAt: null,
          reminderFired: false,
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
          set({ currentFocusTask: null, currentFocusTaskPath: null, lastFocusedTaskId: null })
          get().initializeFocus(projects, path)
        }
      },

      setSessionNotes: (sessionId, notes) => {
        const current = get().sessions.find(session => session.id === sessionId)
        if (!current) return

        const next = { ...current, notes, updatedAt: new Date().toISOString() }
        set({ sessions: get().sessions.map(session => session.id === sessionId ? next : session) })

        const pendingTimer = sessionNotesSyncTimers.get(sessionId)
        if (pendingTimer) clearTimeout(pendingTimer)

        const timer = setTimeout(() => {
          const latest = get().sessions.find(session => session.id === sessionId)
          if (latest) trackFocusSessionUpdated(latest)
          sessionNotesSyncTimers.delete(sessionId)
        }, 800)
        sessionNotesSyncTimers.set(sessionId, timer)
      },

      flushSessionNotesSync: (sessionId) => {
        const pendingTimer = sessionNotesSyncTimers.get(sessionId)
        if (!pendingTimer) return

        clearTimeout(pendingTimer)
        sessionNotesSyncTimers.delete(sessionId)
        const latest = get().sessions.find(session => session.id === sessionId)
        if (latest) trackFocusSessionUpdated(latest)
      },

      setNotepadOpen: (open) => set({ notepadOpen: open }),

      setCurrentFocusTask: (task, path) => {
        if (!task) {
          set({ currentFocusTask: null, currentFocusTaskPath: null })
          return
        }

        let resolvedPath = path
        if (resolvedPath === undefined) {
          const projectId = getProjectId(get().focusStartPath)
          const project = useAppStore.getState().projects.find(candidate => candidate.id === projectId)
          resolvedPath = project ? indexTaskPaths(project.tasks, project.id).get(task.id)?.path ?? null : null
        }

        set({ currentFocusTask: task, currentFocusTaskPath: resolvedPath })
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

      setShowSubtaskCelebration: (show) => set({ showSubtaskCelebration: show }),

      refreshFocusLeaves: () => {
        get().updateFocusLeaves(useAppStore.getState().projects)
        return get().currentFocusTask
      },

      updateFocusLeaves: (projects) => {
        const { focusStartPath, currentFocusTask, currentFocusTaskPath } = get()

        const { leaves: newLeaves, updatedPath } = getHierarchicalLeafNodes(projects, focusStartPath)

        if (!arePathsEqual(updatedPath, focusStartPath)) {
          set({ focusStartPath: updatedPath })
        }

        if (currentFocusTask) {
          const currentProjectId = getProjectId(focusStartPath)
          const project = projects.find(candidate => candidate.id === currentProjectId)
          const indexedPath = project
            ? indexTaskPaths(project.tasks, project.id).get(currentFocusTask.id)?.path ?? null
            : null
          const resolvedPath = currentFocusTaskPath && findTaskAtPath(projects, currentFocusTaskPath)?.id === currentFocusTask.id
            ? currentFocusTaskPath
            : indexedPath
          const currentTaskInProjects = resolvedPath ? findTaskAtPath(projects, resolvedPath) : null
          const currentTaskHasSubtasks = currentTaskInProjects?.subtasks.some(st => !st.completed) ?? false

          if (currentTaskHasSubtasks && resolvedPath) {
            const { leaves: newLeavesForTask, updatedPath } = getHierarchicalLeafNodes(projects, resolvedPath)
            set({
              currentFocusTaskPath: resolvedPath,
              focusStartPath: updatedPath,
              focusModeProjectLeaves: newLeavesForTask,
            })
            return
          }

          if (resolvedPath !== currentFocusTaskPath || currentTaskInProjects !== currentFocusTask) {
            set({ currentFocusTaskPath: resolvedPath, currentFocusTask: currentTaskInProjects })
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
          ...(scopeChanged ? { currentFocusTask: null, currentFocusTaskPath: null } : {}),
        })
      },

      resetFocus: () => {
        get().saveCurrentSessionState()
        set({
          focusModeProjectLeaves: [],
          currentFocusTask: null,
          currentFocusTaskPath: null,
          focusStartPath: [],
          showAddTasksView: false,
          lastFocusedTaskId: null,
        })
      },

      getNextFocusTask: () => {
        set((state) => {
          const { focusStartPath } = state
          const projectId = getProjectId(focusStartPath)
          if (!projectId) return { currentFocusTask: null, currentFocusTaskPath: null }

          const projects = useAppStore.getState().projects
          const project = projects.find((p) => p.id === projectId)
          if (!project) return { currentFocusTask: null, currentFocusTaskPath: null }

          const pathIndex = indexTaskPaths(project.tasks, projectId)
          const focusDepth = focusStartPath.length - 1
          let highestPriority: number[] | null = null
          let highestPriorityEntries: IndexedTaskPath[] = []

          const comparePriorities = (left: number[], right: number[]) => {
            const length = Math.max(left.length, right.length)
            for (let index = 0; index < length; index++) {
              const difference = (left[index] ?? 0) - (right[index] ?? 0)
              if (difference !== 0) return difference
            }
            return 0
          }

          for (const leaf of state.focusModeProjectLeaves) {
            if (leaf.completed || leaf.id === state.currentFocusTask?.id) continue

            const entry = pathIndex.get(leaf.id)
            if (!entry || !arePathsEqual(entry.path.slice(0, focusStartPath.length), focusStartPath)) continue

            const priority = entry.priorities.slice(focusDepth)
            const comparison = highestPriority ? comparePriorities(priority, highestPriority) : 1
            if (comparison > 0) {
              highestPriority = priority
              highestPriorityEntries = [entry]
            } else if (comparison === 0) {
              highestPriorityEntries.push(entry)
            }
          }

          const selected = randomFrom(highestPriorityEntries)
          return selected
            ? { currentFocusTask: selected.task, currentFocusTaskPath: selected.path }
            : { currentFocusTask: null, currentFocusTaskPath: null }
        })
        get().saveCurrentSessionState()
      },

      completeFocusTask: () => {
        const { currentFocusTask, currentFocusTaskPath, focusStartPath } = get()
        const currentProjectId = getProjectId(focusStartPath)

        if (currentFocusTask && currentProjectId) {
          const projects = useAppStore.getState().projects
          const project = projects.find((p) => p.id === currentProjectId)
          if (project) {
            const fullTaskPath = currentFocusTaskPath
              ?? indexTaskPaths(project.tasks, project.id).get(currentFocusTask.id)?.path
            if (fullTaskPath) {

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
          const { activeSessionId } = get()
          if (activeSessionId) {
            updateAndTrackSession(set, get, activeSessionId, session => ({
              ...session,
              completedCount: session.completedCount + 1,
            }))
          }
          get().saveCurrentSessionState()
        }
      },

      // Doubles as re-snooze: keeps the reason, resets any fired reminder
      markPending: (sessionId, remindInMs) => {
        updateAndTrackSession(set, get, sessionId, session => ({
          ...session,
          pending: true,
          remindAt: remindInMs === null ? null : Date.now() + remindInMs,
          reminderFired: false,
        }))
      },

      resolvePending: (sessionId) => {
        updateAndTrackSession(set, get, sessionId, session => ({
          ...session,
          pending: false,
          pendingReason: "",
          remindAt: null,
          reminderFired: false,
        }))
      },

      setPendingReason: (sessionId, reason) => {
        updateAndTrackSession(set, get, sessionId, session => ({
          ...session,
          pendingReason: reason.trim(),
        }))
      },

      // Firing marks "check on it" but the session stays pending until resolved
      fireReminder: (sessionId) => {
        updateAndTrackSession(set, get, sessionId, session => ({
          ...session,
          remindAt: null,
          reminderFired: true,
        }))
      },

      setShowAddTasksView: (show) => {
        set({ showAddTasksView: show })

        if (!show) {
          const projects = useAppStore.getState().projects
          const { currentFocusTask, currentFocusTaskPath, focusStartPath } = get()

          if (currentFocusTask) {
            const currentProjectId = getProjectId(focusStartPath)
            if (currentProjectId) {
              const project = projects.find((p) => p.id === currentProjectId)
              if (project) {
                const resolvedPath = currentFocusTaskPath
                  ?? indexTaskPaths(project.tasks, project.id).get(currentFocusTask.id)?.path
                if (resolvedPath) {
                  const currentTaskInProjects = findTaskAtPath(projects, resolvedPath)
                  const currentTaskHasSubtasks = currentTaskInProjects?.subtasks?.filter(st => !st.completed).length ?? 0 > 0

                  if (currentTaskHasSubtasks) {
                    const { leaves: newLeavesForTask, updatedPath } = getHierarchicalLeafNodes(projects, resolvedPath)
                    const pathIndex = indexTaskPaths(project.tasks, project.id)
                    const selectedTask = randomFrom(newLeavesForTask)

                    set({
                      focusStartPath: updatedPath,
                      focusModeProjectLeaves: newLeavesForTask,
                      currentFocusTask: selectedTask,
                      currentFocusTaskPath: selectedTask ? pathIndex.get(selectedTask.id)?.path ?? null : null,
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
              get().setCurrentFocusTask(randomFrom(availableLeaves))
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
        notepadOpen: state.notepadOpen,
      }),
      // Runs during hydration (unlike onRehydrateStorage's callback, which is
      // silently swallowed for sync storage): normalizes legacy timer fields
      // and fires reminders that expired while the app was closed.
      merge: (persisted, current) => {
        const stored = persisted as Partial<FocusState> | undefined
        if (!stored) return current
        const now = Date.now()
        const sessions = (stored.sessions ?? []).map((rawSession, index) => {
          const session = normalizeSession(rawSession, index)
          if (session.remindAt && session.remindAt <= now && !session.reminderFired) {
            return { ...session, reminderFired: true, remindAt: null }
          }
          return session
        })
        return { ...current, ...stored, sessions }
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

