"use client"
import { Draggable } from '@hello-pangea/dnd'
import React, { memo } from 'react'
import { TaskItem } from './task-item'
import type { TaskData } from '@/lib/types'

interface SortableTaskItemProps {
  task: TaskData
  index: number
  currentPath: string[]
  disabled?: boolean
}

export const SortableTaskItem = memo(function SortableTaskItem({ task, index, currentPath, disabled }: SortableTaskItemProps) {
  return (
    <Draggable 
      draggableId={task.id} 
      index={index}
      isDragDisabled={disabled}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            zIndex: snapshot.isDragging ? 9999 : 'auto',
          }}
          className={`
            ${snapshot.isDragging ? 'z-50 relative' : ''}
          `}
        >
          <TaskItem
            task={task}
            currentPath={currentPath}
            isDragging={snapshot.isDragging}
          />
        </div>
      )}
    </Draggable>
  )
})