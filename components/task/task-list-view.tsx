"use client"
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import type { TaskData } from "@/lib/types"
import { SortableTaskItem } from "./sortable-task-item"
import { useAppStore } from "@/store/app-store"

interface TaskListViewProps {
  tasks: TaskData[]
  currentPath: string[] // Unified path including project and task hierarchy
}

export function TaskListView({ tasks, currentPath }: TaskListViewProps) {
  const reorderTasks = useAppStore((state) => state.reorderTasks)

  function handleDragEnd(result: DropResult) {
    if (!result.destination) {
      return
    }

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex !== destinationIndex) {
      // Get source and target tasks to validate same priority group
      const sourceTask = tasks[sourceIndex]
      const targetTask = tasks[destinationIndex]
      
      // Only allow reordering within the same priority group
      if (sourceTask && targetTask && sourceTask.priority === targetTask.priority) {
        reorderTasks(currentPath, sourceIndex, destinationIndex)
      }
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
