export interface TaskItemData {
  id: string
  name: string
  completed: boolean
  completedAt?: string // ISO string for when task was completed
  subtasks: TaskItemData[]
  isCompleting?: boolean // For animation
}

export interface ProjectData {
  id: string
  name: string
  tasks: TaskItemData[]
}
