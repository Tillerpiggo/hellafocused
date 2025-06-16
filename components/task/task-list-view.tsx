"use client"
import type { TaskItemData } from "@/lib/types"
import { TaskItem } from "./task-item"

interface TaskListViewProps {
  tasks: TaskItemData[]
  projectId: string
  basePathInProject: string[] // Path to the parent of these tasks
}

export function TaskListView({ tasks, projectId, basePathInProject }: TaskListViewProps) {
  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          projectId={projectId}
          currentPathInProject={basePathInProject} // TaskItem will append its own ID
        />
      ))}
    </div>
  )
}
