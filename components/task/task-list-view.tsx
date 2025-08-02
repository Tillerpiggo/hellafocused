"use client"
import { useEffect, useRef, useCallback, useMemo } from 'react'
import type { DropTargetRecord } from '@atlaskit/pragmatic-drag-and-drop/types'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { TaskData } from "@/lib/types"
import { SortableTaskItem } from "./sortable-task-item"
import { useAppStore } from "@/store/app-store"

interface TaskListViewProps {
  tasks: TaskData[]
  currentPath: string[] // Unified path including project and task hierarchy
}

export function TaskListView({ tasks, currentPath }: TaskListViewProps) {
  const reorderTasks = useAppStore((state) => state.reorderTasks)
  const monitorRef = useRef<(() => void) | null>(null)

  // Create efficient ID to index mapping
  const taskIdToIndex = useMemo(() => 
    new Map(tasks.map((task, index) => [task.id, index])), 
    [tasks]
  )

  const handleDrop = useCallback((data: {
    source: { data: Record<string, unknown> }
    location: { current: { dropTargets: DropTargetRecord[] } }
  }) => {
    const { source, location } = data
    
    if (!location.current.dropTargets.length) return
    
    const sourceTaskId = source.data.taskId as string
    const targetTaskId = location.current.dropTargets[0].data.taskId as string
    
    if (sourceTaskId && targetTaskId && sourceTaskId !== targetTaskId) {
      const oldIndex = taskIdToIndex.get(sourceTaskId)
      const newIndex = taskIdToIndex.get(targetTaskId)
      
      if (oldIndex !== undefined && newIndex !== undefined) {
        // Get source and target tasks to validate same priority group
        const sourceTask = tasks[oldIndex]
        const targetTask = tasks[newIndex]
        
        // Only allow reordering within the same priority group
        if (sourceTask && targetTask && sourceTask.priority === targetTask.priority) {
          reorderTasks(currentPath, oldIndex, newIndex)
        }
      }
    }
  }, [tasks, taskIdToIndex, currentPath, reorderTasks])

  useEffect(() => {
    // Clean up previous monitor
    if (monitorRef.current) {
      monitorRef.current()
    }

    // Set up new monitor
    monitorRef.current = monitorForElements({
      onDrop: handleDrop,
    })

    return () => {
      if (monitorRef.current) {
        monitorRef.current()
      }
    }
  }, [handleDrop])

  return (
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
  )
}
