export interface TaskData {
  id: string
  name: string
  description?: string
  completed: boolean
  completionDate?: string // Store as ISO string instead of Date object
  dueDate?: string // Store as ISO string for due date
  lastModificationDate: string // Store as ISO string, tracks last modification
  position?: number // Position for drag-and-drop ordering
  priority: number // Priority: 1 = preferred, 0 = normal, -1 = deferred
  isOrdered?: boolean // When true, subtasks are presented in position order (not random)
  subtasks: TaskData[]
  isCompleting?: boolean // For animation
}

export interface FocusSession {
  id: string
  startPath: string[]
  currentFocusTaskId: string | null
  completedCount: number
  createdAt: number
  timerEndTime?: number | null
  timerFired?: boolean
}

export interface MultiplierBreakdown {
  source: 'due-date-self' | 'due-date-ancestor' | 'habit'
  label: string
  multiplier: number
}

export interface MultiplierResult {
  total: number
  breakdown: MultiplierBreakdown[]
}

export interface ProjectData {
  id: string
  name: string
  lastModificationDate: string // Store as ISO string, tracks last modification
  position?: number // Position for drag-and-drop ordering
  tasks: TaskData[]
}
