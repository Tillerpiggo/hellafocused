"use client"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'
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



  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 9999 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${isDragging ? 'z-50 relative' : ''}
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