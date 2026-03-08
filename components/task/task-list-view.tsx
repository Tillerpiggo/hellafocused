"use client"
import { DragDropContext, Droppable, type DropResult, type DragUpdate, type DragStart } from '@hello-pangea/dnd'
import type { TaskData } from "@/lib/types"
import { SortableTaskItem } from "./sortable-task-item"
import { useAppStore } from "@/store/app-store"
import { useState, useEffect, useMemo } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { isImminentTask } from "@/lib/due-date-utils"

const DEFAULT_VISIBLE = 3

interface TaskListViewProps {
  tasks: TaskData[]
  currentPath: string[] // Unified path including project and task hierarchy
  parentIsOrdered?: boolean
  orderedNumberMap?: Record<string, number>
}

export function TaskListView({ tasks, currentPath, parentIsOrdered, orderedNumberMap }: TaskListViewProps) {
  const reorderTasks = useAppStore((state) => state.reorderTasks)
  const moveTaskWithPriorityChange = useAppStore((state) => state.moveTaskWithPriorityChange)

  const [expanded, setExpanded] = useState(false)
  const pathKey = currentPath.join('/')

  useEffect(() => {
    setExpanded(false)
  }, [pathKey])

  // Track cross-section drag state for styling preview
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [previewPriority, setPreviewPriority] = useState<number | null>(null)

  function handleDragStart(start: DragStart) {
    setDraggedTaskId(start.draggableId)
    setPreviewPriority(null)
  }

  function handleDragUpdate(update: DragUpdate) {
    if (!update.destination || !draggedTaskId) return

    const draggedTask = tasks.find(task => task.id === draggedTaskId)
    const targetTask = tasks[update.destination.index]
    
    if (draggedTask && targetTask && draggedTask.priority !== targetTask.priority) {
      // Cross-section drag detected - set preview priority
      setPreviewPriority(targetTask.priority)
    } else {
      // Same section or no target - clear preview
      setPreviewPriority(null)
    }
  }

  function handleDragEnd(result: DropResult) {
    // Clear drag state
    setDraggedTaskId(null)
    setPreviewPriority(null)
    
    if (!result.destination) {
      return
    }

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex !== destinationIndex) {
      const sourceTask = tasks[sourceIndex]
      
      if (!sourceTask) return

      const sourceTaskPath = [...currentPath, sourceTask.id]

      // Determine destination priority based on visual position
      const normalSectionStartIndex = tasks.findIndex(task => task.priority === 0)
      const deferredSectionStartIndex = tasks.findIndex(task => task.priority === -1)
      
      let destinationPriority: number
      if (normalSectionStartIndex !== -1 && destinationIndex >= normalSectionStartIndex && 
          (deferredSectionStartIndex === -1 || destinationIndex < deferredSectionStartIndex)) {
        destinationPriority = 0  // Normal section
      } else if (deferredSectionStartIndex !== -1 && destinationIndex >= deferredSectionStartIndex) {
        destinationPriority = -1  // Deferred section
      } else {
        destinationPriority = 1  // Preferred section (everything before normal section)
      }
      
      // Check if this is a cross-section move
      if (sourceTask.priority !== destinationPriority) {
        // Cross-section move: use atomic operation to handle priority + positioning
        moveTaskWithPriorityChange(sourceTaskPath, sourceIndex, destinationIndex, destinationPriority)
      } else {
        // Same section move: use regular reorder
        reorderTasks(currentPath, sourceIndex, destinationIndex)
      }
    }
  }

  const imminentOverflowCount = useMemo(() => {
    if (tasks.length <= DEFAULT_VISIBLE) return 0
    return tasks.slice(DEFAULT_VISIBLE).filter(isImminentTask).length
  }, [tasks])

  const effectiveVisible = DEFAULT_VISIBLE + imminentOverflowCount
  const canExpand = tasks.length > effectiveVisible
  const hiddenCount = tasks.length - effectiveVisible
  const baseTasks = tasks.slice(0, effectiveVisible)
  const overflowTasks = tasks.slice(effectiveVisible)

  return (
    <div>
      <DragDropContext
        onDragStart={handleDragStart}
        onDragUpdate={handleDragUpdate}
        onDragEnd={handleDragEnd}
      >
        <Droppable droppableId="task-list">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {baseTasks.map((task, index) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  currentPath={currentPath}
                  disabled={task.completed}
                  previewPriority={task.id === draggedTaskId ? previewPriority : undefined}
                  orderNumber={parentIsOrdered ? (orderedNumberMap?.[task.id] ?? index + 1) : undefined}
                />
              ))}
              {canExpand && (
                <div
                  className="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                  style={{
                    gridTemplateRows: expanded ? '1fr' : '0fr',
                    opacity: expanded ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    {overflowTasks.map((task, i) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        index={effectiveVisible + i}
                        currentPath={currentPath}
                        disabled={task.completed}
                        previewPriority={task.id === draggedTaskId ? previewPriority : undefined}
                        orderNumber={parentIsOrdered ? (orderedNumberMap?.[task.id] ?? effectiveVisible + i + 1) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {canExpand && (
        <div className="mt-3 px-0.5">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full py-3.5 rounded-2xl text-sm font-medium
              bg-primary/[0.07] text-primary/70
              hover:bg-primary/[0.12] hover:text-primary/90
              active:bg-primary/[0.16]
              transition-all duration-300 ease-out
              flex items-center justify-center gap-2"
          >
            {expanded ? (
              <>
                Show less
                <ChevronUp className="h-3.5 w-3.5 opacity-50" />
              </>
            ) : (
              <>
                Show more
                <span className="text-primary/40 text-xs">({hiddenCount})</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
