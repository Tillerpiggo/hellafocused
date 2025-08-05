"use client"
import type { TaskData } from "@/lib/types"
import type React from "react"

import { useAppStore } from "@/store/app-store"
import { useUIStore } from "@/store/ui-store"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, ChevronRight, Star, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskContextMenu } from "./task-context-menu"
import { MoveTaskDialog } from "./move-task-dialog"
import { EditableTitle, type EditableTitleRef } from "@/components/editable-title"
import { useState, useRef, memo } from "react"

interface TaskItemProps {
  task: TaskData
  currentPath: string[] // Unified path to the parent of this task
  isDragging?: boolean
  previewPriority?: number // For cross-section drag styling preview
}

export const TaskItem = memo(function TaskItem({ task, currentPath, isDragging = false, previewPriority }: TaskItemProps) {
  const navigateToTask = useAppStore((state) => state.navigateToTask)
  const updateTaskName = useAppStore((state) => state.updateTaskName)
  const toggleTaskDefer = useAppStore((state) => state.toggleTaskDefer)
  const toggleTaskPrefer = useAppStore((state) => state.toggleTaskPrefer)
  const attemptTaskCompletion = useUIStore((state) => state.attemptTaskCompletion)
  const attemptDeletion = useUIStore((state) => state.attemptDeletion)
  const setFocusMode = useUIStore((state) => state.setFocusMode)
  const [isEditing, setIsEditing] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const editableTitleRef = useRef<EditableTitleRef>(null)

  const taskPath = [...currentPath, task.id]

  // Use preview priority during cross-section drag, otherwise use actual priority
  const effectivePriority = isDragging && previewPriority !== undefined ? previewPriority : task.priority

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
        "flex items-start justify-between p-4 rounded-2xl border group",
        // Only add transitions when not dragging to avoid conflicts with drop animation
        !isDragging && "transition-all duration-200",
        // Dragging state - avoid scale transform to prevent conflicts with drop animation
        isDragging 
          ? [
              "opacity-80",
              task.completed
                ? "bg-muted/60 border-border/40"
                : effectivePriority === 1
                ? "bg-amber-100/70 border-amber-300/60 dark:bg-amber-900/40 dark:border-amber-700/50"
                : effectivePriority === -1
                ? "bg-muted/30 border-border/30"
                : "bg-accent/80 border-primary/30"
            ]
          : [
              "bg-background",
              task.completed
                ? "bg-muted/50 opacity-60 border-border/30"
                : effectivePriority === 1
                ? "bg-amber-50/50 border-amber-200/50 hover:bg-amber-100/50 hover:border-amber-300/50 dark:bg-amber-950/20 dark:border-amber-800/30 dark:hover:bg-amber-900/30 dark:hover:border-amber-700/40"
                : effectivePriority === -1
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
            className={cn(
              "h-8 w-8 flex-shrink-0 rounded-full",
              effectivePriority === 1 && !task.completed && "hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
            )}
          >
            {task.completed ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <Circle className={cn(
                "h-5 w-5 transition-colors",
                effectivePriority === 1 
                  ? "text-amber-500/60 dark:text-amber-400/60 group-hover:text-amber-600 dark:group-hover:text-amber-400"
                  : "text-muted-foreground group-hover:text-primary"
              )} />
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
                effectivePriority === 1 && !task.completed && "text-amber-800/80 dark:text-amber-200/90 font-medium",
                effectivePriority === -1 && !task.completed && "text-muted-foreground"
              )}
              isCompleted={task.completed}
            />
          ) : (
            <span
              className={cn(
                "text-base font-medium break-words", 
                task.completed && "line-through text-muted-foreground",
                effectivePriority === 1 && !task.completed && "text-amber-800/80 dark:text-amber-200/90 font-medium",
                effectivePriority === -1 && !task.completed && "text-muted-foreground"
              )}
            >
              {task.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2 min-h-[2rem]">
        {/* Priority indicators */}
        {effectivePriority === 1 && !task.completed && (
          <Star className="h-4 w-4 text-amber-600/60 fill-amber-600/60 dark:text-amber-400/70 dark:fill-amber-400/70" />
        )}
        {effectivePriority === -1 && !task.completed && (
          <Clock className="h-4 w-4 text-slate-500/60 dark:text-slate-400/70" />
        )}
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
        onTogglePrefer={() => toggleTaskPrefer(taskPath)}
        onDelete={() => attemptDeletion(taskPath)}
        onMove={() => setIsMoveDialogOpen(true)}
        onFocus={() => setFocusMode(true, taskPath)}
        isCompleted={task.completed}
        isDeferred={effectivePriority === -1}
        isPreferred={effectivePriority === 1}
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
})
