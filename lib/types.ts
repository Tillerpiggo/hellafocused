import type { TaskPath } from "./task-path"

export interface TaskData {
  id: string
  name: string
  description?: string
  completed: boolean
  completionDate?: string // Store as ISO string instead of Date object
  lastModificationDate: string // Store as ISO string, tracks last modification
  position?: number // Position for drag-and-drop ordering
  priority: number // Priority: 1 = preferred, 0 = normal, -1 = deferred
  isOrdered?: boolean // When true, subtasks are presented in position order (not random)
  subtasks: TaskData[]
  isCompleting?: boolean // For animation
}

export interface FocusSession {
  id: string
  name: string
  startPath: TaskPath
  browsePath: TaskPath
  view: 'focus' | 'docked' | 'browse'
  currentFocusTaskId: string | null
  completedCount: number
  notes: string
  createdAt: number
  updatedAt: string
  position: number
  pending?: boolean
  pendingReason?: string
  remindAt?: number | null
  reminderFired?: boolean
}

export interface ProjectData {
  id: string
  name: string
  lastModificationDate: string // Store as ISO string, tracks last modification
  position?: number // Position for drag-and-drop ordering
  tasks: TaskData[]
}
