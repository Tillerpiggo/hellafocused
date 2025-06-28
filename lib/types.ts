export interface TaskItemData {
  id: string
  name: string
  completed: boolean
  completionDate?: Date
  subtasks: TaskItemData[]
  isCompleting?: boolean // For animation
}

export interface ProjectData {
  id: string
  name: string
  tasks: TaskItemData[]
}
