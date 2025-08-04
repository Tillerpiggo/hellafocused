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
  const moveTaskWithPriorityChange = useAppStore((state) => state.moveTaskWithPriorityChange)
  
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
      
      if (!sourceTask) return

      const sourceTaskPath = [...currentPath, sourceTask.id]

      // Determine destination priority based on visual position
      const normalSectionStartIndex = tasks.findIndex(task => task.priority === 0)
      const deferredSectionStartIndex = tasks.findIndex(task => task.priority === -1)
      
      let destinationPriority: number
      if (normalSectionStartIndex !== -1 && destinationIndex >= normalSectionStartIndex && 
          (deferredSectionStartIndex === -1 || destinationIndex < deferredSectionStartIndex)) {
        destinationPriority = 0  // Normal section
      } else if (deferredSectionStartIndex !== -1 && destinationIndex >= deferredSectionStartIndex) {
        destinationPriority = -1  // Deferred section
      } else {
        destinationPriority = 1  // Preferred section (everything before normal section)
      }
      
      // Check if this is a cross-section move
      if (sourceTask.priority !== destinationPriority) {
        // Cross-section move: use atomic operation to handle priority + positioning
        moveTaskWithPriorityChange(sourceTaskPath, sourceIndex, destinationIndex, destinationPriority)
      } else {
        // Same section move: use regular reorder
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
