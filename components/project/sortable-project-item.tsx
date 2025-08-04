"use client"
import { Draggable } from '@hello-pangea/dnd'
import React, { memo } from 'react'
import { ProjectListItem } from './project-list-item'
import type { ProjectData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SortableProjectItemProps {
  project: ProjectData
  index: number
}

export const SortableProjectItem = memo(function SortableProjectItem({ project, index }: SortableProjectItemProps) {
  return (
    <Draggable 
      draggableId={project.id} 
      index={index}
    >
      {(provided, snapshot) => {
        // Follow pangea's pattern with custom drop animation timing
        const getStyle = () => {
          // Nearly instant drop animation to prevent scroll positioning issues
          if (snapshot.isDropAnimating && snapshot.dropAnimation) {
            const { moveTo, curve } = snapshot.dropAnimation;
            const translate = `translate(${moveTo.x}px, ${moveTo.y}px)`;
            
            return {
              ...provided.draggableProps.style,
              transform: translate,
              transition: `all ${curve} 0.2s`, // 200ms duration
            };
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
              "mb-3", // 0.75rem spacing between project items (slightly more than tasks)
              snapshot.isDragging && !snapshot.isDropAnimating ? 'z-50 relative' : ''
            )}
          >
            <ProjectListItem
              project={project}
              isDragging={snapshot.isDragging && !snapshot.isDropAnimating}
            />
          </div>
        );
      }}
    </Draggable>
  )
})