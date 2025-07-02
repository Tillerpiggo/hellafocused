export interface TaskData {
  id: string
  name: string
  completed: boolean
  completionDate?: string // Store as ISO string instead of Date object
  lastModificationDate: string // Store as ISO string, tracks last modification
  subtasks: TaskData[]
  isCompleting?: boolean // For animation
}

export interface ProjectData {
  id: string
  name: string
  lastModificationDate: string // Store as ISO string, tracks last modification
  tasks: TaskData[]
}
