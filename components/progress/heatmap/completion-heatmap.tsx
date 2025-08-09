'use client'

import { useMemo, useState } from 'react'
import { ProjectData, TaskData } from '@/lib/types'
import { HeatmapDay } from './heatmap-day'
import { HeatmapTooltip } from './heatmap-tooltip'

interface CompletionHeatmapProps {
  projects: ProjectData[]
}

interface TooltipState {
  date: string
  count: number
}

export function CompletionHeatmap({ projects }: CompletionHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const completions = useMemo(() => {
    const counts: Record<string, number> = {}

    const processTask = (task: TaskData) => {
      if (task.completed && task.completionDate) {
        const dateKey = task.completionDate.split('T')[0]
        counts[dateKey] = (counts[dateKey] || 0) + 1
      }
      task.subtasks.forEach(processTask)
    }

    projects.forEach(project => {
      project.tasks.forEach(processTask)
    })

    return counts
  }, [projects])

  const days = useMemo(() => {
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
    
    return Array.from({ length: 365 }, (_, i) => {
      const date = new Date(oneYearAgo)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      
      return {
        date,
        dateKey,
        count: completions[dateKey] || 0
      }
    })
  }, [completions])

  return (
    <div className="relative">
      <div 
        className="grid grid-rows-7 grid-flow-col gap-1"
        onMouseLeave={() => setTooltip(null)}
      >
        {days.map(({ date, dateKey, count }) => (
          <HeatmapDay
            key={dateKey}
            date={date}
            count={count}
            onHover={(date, count) => setTooltip({ date: dateKey, count })}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getColorClass(level)}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      {tooltip && (
        <HeatmapTooltip
          date={tooltip.date}
          count={tooltip.count}
        />
      )}
    </div>
  )
}

function getColorClass(level: number): string {
  const colors = [
    'bg-gray-100 dark:bg-gray-800',
    'bg-blue-100 dark:bg-blue-900',
    'bg-blue-300 dark:bg-blue-700',
    'bg-blue-500 dark:bg-blue-500',
    'bg-blue-700 dark:bg-blue-300'
  ]
  return colors[level] || colors[0]
}