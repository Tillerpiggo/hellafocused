"use client"
import { DragDropContext, Droppable, type DropResult, type DragUpdate, type DragStart } from '@hello-pangea/dnd'
import type { TaskData } from "@/lib/types"
import { SortableTaskItem } from "./sortable-task-item"
import { useAppStore } from "@/store/app-store"
import { useState } from "react"

interface TaskListViewProps {
  tasks: TaskData[]
  currentPath: string[] // Unified path including project and task hierarchy
}

export function TaskListView({ tasks, currentPath }: TaskListViewProps) {
  const reorderTasks = useAppStore((state) => state.reorderTasks)
  const setTaskPriority = useAppStore((state) => state.setTaskPriority)
  
  // Track cross-section drag state for styling preview
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [previewPriority, setPreviewPriority] = useState<number | null>(null)

  function handleDragStart(start: DragStart) {
    setDraggedTaskId(start.draggableId)
    setPreviewPriority(null)
  }

  function handleDragUpdate(update: DragUpdate) {
    if (!update.destination || !draggedTaskId) return

    const draggedTask = tasks.find(task => task.id === draggedTaskId)
    const targetTask = tasks[update.destination.index]
    
    if (draggedTask && targetTask && draggedTask.priority !== targetTask.priority) {
      // Cross-section drag detected - set preview priority
      setPreviewPriority(targetTask.priority)
    } else {
      // Same section or no target - clear preview
      setPreviewPriority(null)
    }
  }

  function handleDragEnd(result: DropResult) {
    // Clear drag state
    setDraggedTaskId(null)
    setPreviewPriority(null)
    
    if (!result.destination) {
      return
    }

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex !== destinationIndex) {
      const sourceTask = tasks[sourceIndex]
      const targetTask = tasks[destinationIndex]
      
      if (!sourceTask) return

      const sourceTaskPath = [...currentPath, sourceTask.id]

      // Check if moving between different priority sections
      if (targetTask && sourceTask.priority !== targetTask.priority) {
        // For cross-section drags, we need to:
        // 1. Change priority to match destination section
        // 2. Calculate where in that section the task should go
        
        const newPriority = targetTask.priority
        
        // Find all tasks in the target priority section (excluding the source task)
        const targetSectionTasks = tasks.filter(task => 
          task.priority === newPriority && task.id !== sourceTask.id
        )
        
        // Map destination index to position within target section
        // destinationIndex is relative to the whole list, we need position within target section
        let targetSectionPosition = 0
        
        // Count how many target section tasks appear before the destination index
        for (let i = 0; i < destinationIndex; i++) {
          if (i < tasks.length && tasks[i].priority === newPriority && tasks[i].id !== sourceTask.id) {
            targetSectionPosition++
          }
        }
        
        // Clamp to valid range
        targetSectionPosition = Math.min(targetSectionPosition, targetSectionTasks.length)
        
        // Change priority first
        setTaskPriority(sourceTaskPath, newPriority)
        
        // Find the actual task to insert before/after in the target section
        if (targetSectionTasks.length === 0) {
          // Target section is empty, task will be the only one
          // No reordering needed
        } else if (targetSectionPosition >= targetSectionTasks.length) {
          // Insert at end of target section
          const lastTargetTask = targetSectionTasks[targetSectionTasks.length - 1]
          const lastTargetIndex = tasks.findIndex(task => task.id === lastTargetTask.id)
          reorderTasks(currentPath, sourceIndex, lastTargetIndex + 1)
        } else {
          // Insert at specific position in target section
          const insertBeforeTask = targetSectionTasks[targetSectionPosition]
          const insertBeforeIndex = tasks.findIndex(task => task.id === insertBeforeTask.id)
          reorderTasks(currentPath, sourceIndex, insertBeforeIndex)
        }
      } else {
        // Same priority group - just reorder
        reorderTasks(currentPath, sourceIndex, destinationIndex)
      }
    }
  }

  return (
    <DragDropContext 
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
      onDragEnd={handleDragEnd}
    >
      <Droppable droppableId="task-list">
        {(provided) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                index={index}
                currentPath={currentPath}
                disabled={task.completed}
                previewPriority={task.id === draggedTaskId ? previewPriority : undefined}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
