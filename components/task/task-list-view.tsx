"use client"
import type { TaskData } from "@/lib/types"
import { TaskItem } from "./task-item"
import { useAppStore } from "@/store/app-store"
import { useState } from "react"

interface TaskListViewProps {
  tasks: TaskData[]
  currentPath: string[] // Unified path including project and task hierarchy
}

export function TaskListView({ tasks, currentPath }: TaskListViewProps) {
  const reorderTasks = useAppStore((state) => state.reorderTasks)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderTasks(currentPath, draggedIndex, dropIndex)
    }
    
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-1">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          draggable={!task.completed}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            ${draggedIndex === index ? "opacity-50" : ""}
            ${dragOverIndex === index && draggedIndex !== index ? "border-t-2 border-primary" : ""}
            transition-opacity duration-200
          `}
        >
          <TaskItem
            task={task}
            currentPath={currentPath}
            isDragging={draggedIndex === index}
          />
        </div>
      ))}
    </div>
  )
}
