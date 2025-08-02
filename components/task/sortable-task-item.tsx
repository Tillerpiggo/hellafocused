"use client"
import { useEffect, useRef, useState } from 'react'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { TaskItem } from './task-item'
import type { TaskData } from '@/lib/types'

interface SortableTaskItemProps {
  task: TaskData
  currentPath: string[]
  disabled?: boolean
}

export function SortableTaskItem({ task, currentPath, disabled }: SortableTaskItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDropTarget, setIsDropTarget] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || disabled) return

    return combine(
      draggable({
        element,
        getInitialData: () => ({ taskId: task.id }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({ x: '16px', y: '8px' }),
            render: ({ container }) => {
              const clone = element.cloneNode(true) as HTMLElement
              clone.style.transform = 'rotate(3deg)'
              clone.style.opacity = '0.8'
              container.appendChild(clone)
            },
          })
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        getData: () => ({ taskId: task.id }),
        canDrop: ({ source }) => {
          const sourceTaskId = source.data.taskId
          return sourceTaskId !== task.id
        },
        onDragEnter: () => setIsDropTarget(true),
        onDragLeave: () => setIsDropTarget(false),
        onDrop: () => setIsDropTarget(false),
      })
    )
  }, [task.id, disabled])

  return (
    <div
      ref={ref}
      className={`
        ${isDragging ? 'z-50 relative opacity-50' : ''}
        ${isDropTarget ? 'ring-2 ring-primary/30' : ''}
      `}
      style={{
        zIndex: isDragging ? 9999 : 'auto',
      }}
    >
      <TaskItem
        task={task}
        currentPath={currentPath}
        isDragging={isDragging}
      />
    </div>
  )
}