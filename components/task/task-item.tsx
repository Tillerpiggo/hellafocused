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
import { DueDateBadge } from "./due-date-badge"
import { DueDatePicker } from "./due-date-picker"
import { EditableTitle, type EditableTitleRef } from "@/components/editable-title"
import { useState, useRef, memo } from "react"

interface TaskItemProps {
  task: TaskData
  currentPath: string[] // Unified path to the parent of this task
  isDragging?: boolean
  previewPriority?: number // For cross-section drag styling preview
  onEditingChange?: (isEditing: boolean) => void
  orderNumber?: number // When set, shows a numbered circle instead of a checkbox (parent is ordered)
}

export const TaskItem = memo(function TaskItem({ task, currentPath, isDragging = false, previewPriority, onEditingChange, orderNumber }: TaskItemProps) {
  const navigateToTask = useAppStore((state) => state.navigateToTask)
  const updateTaskName = useAppStore((state) => state.updateTaskName)
  const toggleTaskDefer = useAppStore((state) => state.toggleTaskDefer)
  const toggleTaskPrefer = useAppStore((state) => state.toggleTaskPrefer)
  const setTaskDueDate = useAppStore((state) => state.setTaskDueDate)
  const dueSoonDays = useAppStore((state) => state.dueSoonDays)
  const attemptTaskCompletion = useUIStore((state) => state.attemptTaskCompletion)
  const attemptDeletion = useUIStore((state) => state.attemptDeletion)

  const [isEditing, setIsEditing] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [showDueDatePicker, setShowDueDatePicker] = useState(false)
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
        !isDragging && "transition-all duration-200 ease-out",
        task.completed
          ? "task-item-completed"
          : effectivePriority === 1
          ? "task-item-priority"
          : effectivePriority === -1
          ? "task-item-deferred"
          : "task-item-normal",
        "cursor-pointer shadow-sm hover:shadow-md",
      )}
      data-dragging={isDragging || undefined}
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
              effectivePriority === 1 && !task.completed && "hover:bg-taskPriority-from/30"
            )}
          >
            {isEditing ? (
              <Edit3 className="h-4 w-4 text-primary" />
            ) : orderNumber !== undefined ? (
              <span className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-semibold",
                task.completed
                  ? "bg-primary/10 text-primary/40 line-through"
                  : "bg-primary/15 text-primary"
              )}>
                {orderNumber}
              </span>
            ) : task.completed ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <Circle className={cn(
                "h-5 w-5 transition-colors",
                effectivePriority === 1 ? "task-circle-priority" : "task-circle-normal"
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
                  task.completed ? "task-text-completed"
                    : effectivePriority === 1 ? "task-text-priority"
                    : effectivePriority === -1 ? "task-text-deferred"
                    : undefined
                )}
                isCompleted={task.completed}
              />
            ) : (
              <span
                className={cn(
                  "text-base font-medium break-words",
                  task.completed ? "task-text-completed"
                    : effectivePriority === 1 ? "task-text-priority"
                    : effectivePriority === -1 ? "task-text-deferred"
                    : undefined
                )}
              >
                {task.name}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
        {!task.completed && task.dueDate && (
          <DueDateBadge dueDate={task.dueDate} dueSoonDays={dueSoonDays} />
        )}
        {effectivePriority === 1 && !task.completed && (
          <Star className="h-4 w-4 text-priority-icon/60 fill-priority-fill/60" />
        )}
        {effectivePriority === -1 && !task.completed && (
          <Clock className="h-4 w-4 text-slate-500/60 dark:text-slate-400/70" />
        )}
<ChevronRight className={cn(
          "h-4 w-4 transition-colors",
          isEditing
            ? "text-muted-foreground/30"
            : effectivePriority === 1 && !task.completed
            ? "task-chevron-priority"
            : "group-hover:text-primary"
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
        onSetDueDate={() => setShowDueDatePicker(true)}
        hasDueDate={!!task.dueDate}
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

      <DueDatePicker
        dueDate={task.dueDate}
        onDateChange={(date) => {
          setTaskDueDate(taskPath, date)
          setShowDueDatePicker(false)
        }}
        open={showDueDatePicker}
        onOpenChange={(open) => { if (!open) setShowDueDatePicker(false) }}
        hideTrigger
      />
    </>
  )
})
