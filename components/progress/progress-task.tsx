'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { TaskData, MultiplierBreakdown } from '@/lib/types'

interface ProgressTaskProps {
  task: TaskData & {
    projectName: string
    path: string[]
    focusPoints: number
    multiplierBreakdown?: MultiplierBreakdown[]
    multiplierTotal?: number
  }
  depth: number
}

export function ProgressTask({ task, depth }: ProgressTaskProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMultiplierDetail, setShowMultiplierDetail] = useState(false)

  const todaysCompletedSubtasks = task.subtasks.filter(subtask => {
    if (!subtask.completed || !subtask.completionDate) return false
    const taskDate = new Date(subtask.completionDate).toDateString()
    const today = new Date().toDateString()
    return taskDate === today
  })

  const hasCompletedSubtasks = todaysCompletedSubtasks.length > 0
  const hasMultiplier = (task.multiplierTotal ?? 1) > 1

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
        className="flex items-center gap-2.5 py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
        onClick={() => {
          if (hasMultiplier) {
            setShowMultiplierDetail(!showMultiplierDetail)
          } else if (hasCompletedSubtasks) {
            setIsExpanded(!isExpanded)
          }
        }}
      >
        {hasCompletedSubtasks || hasMultiplier ? (
          <ChevronRight
            className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform ${
              (hasMultiplier ? showMultiplierDetail : isExpanded) ? 'rotate-90' : ''
            }`}
          />
        ) : (
          <div className="w-3.5" />
        )}

        <span className="flex-1 text-sm text-foreground">
          {task.name}
        </span>

        <div className="flex items-center gap-3 flex-shrink-0">
          {task.completionDate && (
            <span className="text-xs text-muted-foreground/60">
              {formatTime(task.completionDate)}
            </span>
          )}
          <span className="text-xs font-medium text-primary tabular-nums">
            +{task.focusPoints}
          </span>
        </div>
      </div>

      {showMultiplierDetail && hasMultiplier && task.multiplierBreakdown && (
        <div className="ml-8 py-1 px-3">
          <span className="text-xs text-muted-foreground">
            {task.multiplierBreakdown.map((b, i) => (
              <span key={`${b.source}-${i}`}>
                {i > 0 && ' · '}
                {b.source === 'due-date-self' ? '🎯' : '📋'} {b.label} ×{b.multiplier}
              </span>
            ))}
            {' = '}
            <span className="font-medium text-multiplier">×{task.multiplierTotal}</span>
          </span>
        </div>
      )}

      {isExpanded && hasCompletedSubtasks && !showMultiplierDetail && (
        <div className="ml-2">
          {todaysCompletedSubtasks.map((subtask) => (
            <ProgressTask
              key={subtask.id}
              task={{
                ...subtask,
                projectName: task.projectName,
                path: [...task.path, subtask.id],
                focusPoints: 1,
              }}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
