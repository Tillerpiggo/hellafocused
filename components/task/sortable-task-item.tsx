"use client"
import { Draggable } from '@hello-pangea/dnd'
import React, { memo } from 'react'
import { TaskItem } from './task-item'
import type { TaskData } from '@/lib/types'
import { cn } from '@/lib/utils'

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
      {(provided, snapshot) => {
        // Follow pangea's pattern - let drop animation handle styling during drop
        const getStyle = () => {
          if (snapshot.isDropAnimating) {
            // During drop animation, only use pangea's provided styles
            return provided.draggableProps.style;
          }
          
          // During drag, add our custom z-index
          return {
            ...provided.draggableProps.style,
            zIndex: snapshot.isDragging ? 9999 : 'auto',
          };
        };

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={getStyle()}
            className={cn(
              "mb-2", // 0.5rem spacing between items
              snapshot.isDragging && !snapshot.isDropAnimating ? 'z-50 relative' : ''
            )}
          >
            <TaskItem
              task={task}
              currentPath={currentPath}
              isDragging={snapshot.isDragging && !snapshot.isDropAnimating}
            />
          </div>
        );
      }}
    </Draggable>
  )
})