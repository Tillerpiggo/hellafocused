"use client"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { TaskData } from "@/lib/types"
import { SortableTaskItem } from "./sortable-task-item"
import { useAppStore } from "@/store/app-store"

interface TaskListViewProps {
  tasks: TaskData[]
  currentPath: string[] // Unified path including project and task hierarchy
}

export function TaskListView({ tasks, currentPath }: TaskListViewProps) {
  const reorderTasks = useAppStore((state) => state.reorderTasks)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Create efficient ID to index mapping
  const taskIdToIndex = new Map(tasks.map((task, index) => [task.id, index]))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = taskIdToIndex.get(active.id as string)
      const newIndex = taskIdToIndex.get(over.id as string)
      
      if (oldIndex !== undefined && newIndex !== undefined) {
        reorderTasks(currentPath, oldIndex, newIndex)
      }
    }
  }

  // Only allow dragging of incomplete tasks - use task IDs directly
  const taskItems = tasks.map(task => task.id)

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={taskItems}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              currentPath={currentPath}
              disabled={task.completed}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
