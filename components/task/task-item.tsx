"use client"
import type { TaskItemData } from "@/lib/types"
import type React from "react"

import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { CheckSquare, Square, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskContextMenu } from "./task-context-menu"
import { EditableTitle } from "@/components/editable-title"
import { useState } from "react"

interface TaskItemProps {
  task: TaskItemData
  projectId: string
  currentPathInProject: string[] // Path to this task from project root
}

export function TaskItem({ task, projectId, currentPathInProject }: TaskItemProps) {
  const navigateToTask = useAppStore((state) => state.navigateToTask)
  const toggleTaskCompletion = useAppStore((state) => state.toggleTaskCompletion)
  const deleteTask = useAppStore((state) => state.deleteTask)
  const updateTaskName = useAppStore((state) => state.updateTaskName)
  const [isEditing, setIsEditing] = useState(false)

  const taskPath = [...currentPathInProject, task.id]

  const handleToggleCompletion = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleTaskCompletion(projectId, taskPath)
  }

  const handleNavigate = () => {
    if (!isEditing) {
      // Always navigate, even if task is completed
      navigateToTask(task.id)
    }
  }

  const handleEdit = () => {
    if (!task.completed) {
      setIsEditing(true)
    }
  }

  const handleToggleComplete = () => {
    toggleTaskCompletion(projectId, taskPath)
  }

  const handleDelete = () => {
    deleteTask(projectId, taskPath)
  }

  const handleTaskNameChange = (newName: string) => {
    updateTaskName(projectId, taskPath, newName)
    setIsEditing(false)
  }

  const taskContent = (
    <div
      className={cn(
        "flex items-center justify-between p-4 my-2 rounded-2xl border transition-all duration-300 group",
        task.completed
          ? "bg-muted/20 opacity-60 border-border/30"
          : "hover:bg-accent/50 hover:border-primary/30 border-border/50",
        isEditing && "bg-accent/70 border-primary/50",
        "cursor-pointer",
      )}
      onClick={handleNavigate}
    >
      <div className="flex items-center gap-4 flex-grow min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCompletion}
          className="h-8 w-8 flex-shrink-0 rounded-full"
        >
          {task.completed ? (
            <CheckSquare className="h-5 w-5 text-primary" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </Button>
        {isEditing ? (
          <EditableTitle
            value={task.name}
            onChange={handleTaskNameChange}
            className={cn("text-base font-medium", task.completed && "line-through text-muted-foreground")}
            isCompleted={task.completed}
          />
        ) : (
          <span
            className={cn("text-base font-medium truncate", task.completed && "line-through text-muted-foreground")}
          >
            {task.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
        <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
      </div>
    </div>
  )

  if (isEditing) {
    return taskContent
  }

  return (
    <TaskContextMenu
      onEdit={handleEdit}
      onToggleComplete={handleToggleComplete}
      onDelete={handleDelete}
      isCompleted={task.completed}
    >
      {taskContent}
    </TaskContextMenu>
  )
}
