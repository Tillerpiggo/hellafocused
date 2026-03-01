"use client"
import type { TaskData } from "@/lib/types"
import type React from "react"

import { useAppStore } from "@/store/app-store"
import { useUIStore } from "@/store/ui-store"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, ChevronRight, Star, Clock, Edit3 } from "lucide-react"
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
  onEditingChange?: (isEditing: boolean) => void
}

export const TaskItem = memo(function TaskItem({ task, currentPath, isDragging = false, previewPriority, onEditingChange }: TaskItemProps) {
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
    onEditingChange?.(false)
  }

  const taskContent = (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl group glass-card",
        // Only add transitions when not dragging to avoid conflicts with drop animation
        !isDragging && "transition-all duration-200 ease-out",
        isDragging
          ? [
              "opacity-80",
              task.completed
                ? "backdrop-blur-sm bg-muted/30"
                : effectivePriority === 1
                ? "backdrop-blur-md bg-muted/50 border-priority/50"
                : effectivePriority === -1
                ? "backdrop-blur-sm bg-muted/30"
                : "backdrop-blur-md bg-muted/50"
            ]
          : [
              task.completed
                ? "backdrop-blur-sm bg-muted/30 opacity-75"
                : effectivePriority === 1
                ? "backdrop-blur-md bg-muted/50 hover:bg-muted/65 border-priority/40 hover:border-priority/60"
                : effectivePriority === -1
                ? "backdrop-blur-sm bg-muted/40 opacity-70 hover:bg-muted/55"
                : "backdrop-blur-md bg-muted/50 hover:bg-muted/65",
            ],
        "cursor-pointer shadow-sm hover:shadow-md",
      )}
      onClick={handleNavigate}
    >
      <div className="flex items-center gap-4 flex-grow min-w-0">
        <div className="flex items-center flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleCompletion}
            className={cn(
              "h-8 w-8 flex-shrink-0 rounded-full",
              effectivePriority === 1 && !task.completed && "hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
            )}
          >
            {isEditing ? (
              <Edit3 className="h-4 w-4 text-primary" />
            ) : task.completed ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <Circle className={cn(
                "h-5 w-5 transition-colors",
                effectivePriority === 1 
                  ? "text-priority/60 dark:text-priority-dark/60 group-hover:text-priority-dark dark:group-hover:text-priority-dark"
                  : "text-muted-foreground group-hover:text-primary"
              )} />
            )}
          </Button>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center min-h-[2rem]">
            {isEditing ? (
              <EditableTitle
                ref={editableTitleRef}
                value={task.name}
                onChange={handleTaskNameChange}
                className={cn(
                  "text-base font-medium", 
                  task.completed && "line-through text-muted-foreground",
                  effectivePriority === 1 && !task.completed && "text-priority-dark/80 dark:text-priority-light/90 font-medium",
                  effectivePriority === -1 && !task.completed && "text-muted-foreground"
                )}
                isCompleted={task.completed}
              />
            ) : (
              <span
                className={cn(
                  "text-base font-medium break-words", 
                  task.completed && "line-through text-muted-foreground",
                  effectivePriority === 1 && !task.completed && "text-priority-dark/80 dark:text-priority-light/90 font-medium",
                  effectivePriority === -1 && !task.completed && "text-muted-foreground"
                )}
              >
                {task.name}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
        {/* Priority indicators */}
        {effectivePriority === 1 && !task.completed && (
          <Star className="h-4 w-4 text-priority/60 fill-priority-fill/60 dark:text-priority-dark/70 dark:fill-priority-fill/70" />
        )}
        {effectivePriority === -1 && !task.completed && (
          <Clock className="h-4 w-4 text-slate-500/60 dark:text-slate-400/70" />
        )}
<ChevronRight className={cn(
          "h-4 w-4 transition-colors",
          isEditing ? "text-muted-foreground/30" : "group-hover:text-primary"
        )} />
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
          onEditingChange?.(true)
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
