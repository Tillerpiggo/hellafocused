"use client"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRef, useLayoutEffect, useState } from 'react'
import { TaskItem } from './task-item'
import type { TaskData } from '@/lib/types'

interface SortableTaskItemProps {
  task: TaskData
  currentPath: string[]
  disabled?: boolean
}

export function SortableTaskItem({ task, currentPath, disabled }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: disabled
  })

  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  // Capture dimensions when dragging starts
  useLayoutEffect(() => {
    if (isDragging && elementRef.current && !dimensions) {
      const rect = elementRef.current.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height
      })
    } else if (!isDragging && dimensions) {
      setDimensions(null)
    }
  }, [isDragging, dimensions])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    // Preserve original dimensions when dragging
    ...(isDragging && dimensions && {
      width: dimensions.width,
      height: dimensions.height,
      minHeight: dimensions.height,
      maxHeight: dimensions.height,
    }),
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        elementRef.current = node
      }}
      style={style}
      className={`
        ${isDragging ? 'z-50' : ''}
        ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}
      `}
      {...attributes}
      {...listeners}
    >
      <TaskItem
        task={task}
        currentPath={currentPath}
        isDragging={isDragging}
      />
    </div>
  )
} 