"use client"
import type { TaskItemData } from "@/lib/types"
import type React from "react"

import { useAppStore } from "@/store/app-store"
import { useUIStore } from "@/store/ui-store"
import { Button } from "@/components/ui/button"
import { CheckSquare, Square, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskContextMenu } from "./task-context-menu"
import { EditableTitle, type EditableTitleRef } from "@/components/editable-title"
import { useState, useRef } from "react"

interface TaskItemProps {
  task: TaskItemData
  currentPath: string[] // Unified path to the parent of this task
}

export function TaskItem({ task, currentPath }: TaskItemProps) {
  const navigateToTask = useAppStore((state) => state.navigateToTask)
  const updateTaskName = useAppStore((state) => state.updateTaskName)
  const attemptTaskCompletion = useUIStore((state) => state.attemptTaskCompletion)
  const attemptDeletion = useUIStore((state) => state.attemptDeletion)
  const [isEditing, setIsEditing] = useState(false)
  const editableTitleRef = useRef<EditableTitleRef>(null)

  const taskPath = [...currentPath, task.id]

  const handleToggleCompletion = (e: React.MouseEvent) => {
    e.stopPropagation()
    attemptTaskCompletion(taskPath)
  }

  const handleNavigate = () => {
    if (!isEditing) {
      // Always navigate, even if task is completed
      navigateToTask(task.id)
    }
  }

  const handleTaskNameChange = (newName: string) => {
    updateTaskName(taskPath, newName)
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
            ref={editableTitleRef}
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
      onEdit={() => {
        setIsEditing(true)
        // Focus the editable title after state updates
        setTimeout(() => editableTitleRef.current?.focus(), 0)
      }}
      onToggleComplete={() => attemptTaskCompletion(taskPath)}
      onDelete={() => attemptDeletion(taskPath)}
      isCompleted={task.completed}
    >
      {taskContent}
    </TaskContextMenu>
  )
}
