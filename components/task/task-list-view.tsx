"use client"
import type { TaskItemData } from "@/lib/types"
import { TaskItem } from "./task-item"

interface TaskListViewProps {
  tasks: TaskItemData[]
  currentPath: string[] // Unified path including project and task hierarchy
}

export function TaskListView({ tasks, currentPath }: TaskListViewProps) {
  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          currentPath={currentPath} // TaskItem will append its own ID
        />
      ))}
    </div>
  )
}
