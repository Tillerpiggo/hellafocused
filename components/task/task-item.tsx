"use client"
import type { TaskData } from "@/lib/types"
import type React from "react"

import { useAppStore } from "@/store/app-store"
import { useUIStore } from "@/store/ui-store"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskContextMenu } from "./task-context-menu"
import { MoveTaskDialog } from "./move-task-dialog"
import { EditableTitle, type EditableTitleRef } from "@/components/editable-title"
import { useState, useRef } from "react"

interface TaskItemProps {
  task: TaskData
  currentPath: string[] // Unified path to the parent of this task
  isDragging?: boolean
}

export function TaskItem({ task, currentPath, isDragging = false }: TaskItemProps) {
  const navigateToTask = useAppStore((state) => state.navigateToTask)
  const updateTaskName = useAppStore((state) => state.updateTaskName)
  const toggleTaskDefer = useAppStore((state) => state.toggleTaskDefer)
  const attemptTaskCompletion = useUIStore((state) => state.attemptTaskCompletion)
  const attemptDeletion = useUIStore((state) => state.attemptDeletion)
  const setFocusMode = useUIStore((state) => state.setFocusMode)
  const [isEditing, setIsEditing] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
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
        "flex items-start justify-between p-4 my-2 rounded-2xl border transition-all duration-300 group",
        // Dragging state takes highest precedence
        isDragging 
          ? "bg-accent/80 border-primary/30 opacity-80 scale-95"
          : [
              "bg-background",
              task.completed
                ? "bg-muted/50 opacity-60 border-border/30"
                : task.priority === -1
                ? "bg-muted/20 opacity-70 border-border/20 hover:bg-muted/30 hover:border-border/30"
                : "hover:bg-accent/80 hover:border-primary/30 border-border/50",
              isEditing && "bg-accent border-primary/50",
            ],
        "cursor-pointer",
      )}
      onClick={handleNavigate}
    >
      <div className="flex items-start gap-4 flex-grow min-w-0">
        <div className="flex items-center min-h-[2rem] pt-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleCompletion}
            className="h-8 w-8 flex-shrink-0 rounded-full"
          >
            {task.completed ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </Button>
        </div>
        <div className="flex items-center min-h-[2rem] flex-grow min-w-0">
          {isEditing ? (
            <EditableTitle
              ref={editableTitleRef}
              value={task.name}
              onChange={handleTaskNameChange}
              className={cn(
                "text-base font-medium", 
                task.completed && "line-through text-muted-foreground",
                task.priority === -1 && !task.completed && "text-muted-foreground"
              )}
              isCompleted={task.completed}
            />
          ) : (
            <span
              className={cn(
                "text-base font-medium break-words", 
                task.completed && "line-through text-muted-foreground",
                task.priority === -1 && !task.completed && "text-muted-foreground"
              )}
            >
              {task.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2 min-h-[2rem]">
        <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
      </div>
    </div>
  )

  if (isEditing) {
    return taskContent
  }

  return (
    <>
      <TaskContextMenu
        onEdit={() => {
          setIsEditing(true)
          // Focus the editable title after state updates
          setTimeout(() => editableTitleRef.current?.focus(), 0)
        }}
        onToggleComplete={() => attemptTaskCompletion(taskPath)}
        onToggleDefer={() => toggleTaskDefer(taskPath)}
        onDelete={() => attemptDeletion(taskPath)}
        onMove={() => setIsMoveDialogOpen(true)}
        onFocus={() => setFocusMode(true, taskPath)}
        isCompleted={task.completed}
        isDeferred={task.priority === -1}
      >
        {taskContent}
      </TaskContextMenu>
      
      <MoveTaskDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        taskPath={taskPath}
        taskName={task.name}
      />
    </>
  )
}
