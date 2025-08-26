'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { TaskData } from '@/lib/types'

interface ProgressTaskProps {
  task: TaskData & { 
    projectName: string
    path: string[]
    focusPoints: number
  }
  depth: number
}

export function ProgressTask({ task, depth }: ProgressTaskProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Get completed subtasks from today
  const todaysCompletedSubtasks = task.subtasks.filter(subtask => {
    if (!subtask.completed || !subtask.completionDate) return false
    const taskDate = new Date(subtask.completionDate).toDateString()
    const today = new Date().toDateString()
    return taskDate === today
  })

  const hasCompletedSubtasks = todaysCompletedSubtasks.length > 0

  const calculateSubtaskFocusPoints = (subtask: TaskData): number => {
    const today = new Date().toDateString()
    
    // Only count this subtask if it was completed today
    let points = 0
    if (subtask.completed && subtask.completionDate) {
      const taskDate = new Date(subtask.completionDate).toDateString()
      if (taskDate === today) {
        points = 1
      }
    }
    
    // Recursively count subtasks that were completed today
    subtask.subtasks.forEach(subSubtask => {
      points += calculateSubtaskFocusPoints(subSubtask)
    })
    return points
  }

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const indentationClass = depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : ''

  return (
    <div className={indentationClass}>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
        onClick={() => hasCompletedSubtasks && setIsExpanded(!isExpanded)}
      >
        {/* Chevron for expandable tasks */}
        {hasCompletedSubtasks ? (
          <ChevronRight 
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        ) : (
          <div className="w-4" />
        )}

        {/* Focus points badge */}
        <div className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-medium rounded-full flex-shrink-0 shadow-sm">
          +{task.focusPoints}
        </div>

        {/* Task name */}
        <span className="flex-1 text-sm text-foreground">
          {task.name}
        </span>

        {/* Time + Focus points badge column (fixed width) */}
        <div className="flex items-center gap-2">
          {/* Completion time (variable width) */}
          {task.completionDate && (
            <span className="text-xs text-muted-foreground">
              {formatTime(task.completionDate)}
            </span>
          )}
          
          {/* Fixed-width badge container */}
          <div className="w-20 flex justify-center">
            <div className="px-2 py-1 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-800/50">
              {task.focusPoints} point{task.focusPoints !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded subtasks */}
      {isExpanded && hasCompletedSubtasks && (
        <div className="ml-2">
          {todaysCompletedSubtasks.map((subtask) => (
            <ProgressTask
              key={subtask.id}
              task={{
                ...subtask,
                projectName: task.projectName,
                path: [...task.path, subtask.id],
                focusPoints: calculateSubtaskFocusPoints(subtask)
              }}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}