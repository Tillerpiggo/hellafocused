export interface TaskItemData {
  id: string
  name: string
  completed: boolean
  completionDate?: string // Store as ISO string instead of Date object
  subtasks: TaskItemData[]
  isCompleting?: boolean // For animation
}

export interface ProjectData {
  id: string
  name: string
  tasks: TaskItemData[]
}
