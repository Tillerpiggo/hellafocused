'use client'

import { useMemo, useState } from 'react'
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react'
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

  const { refs, floatingStyles } = useFloating({
    open: tooltip !== null,
    placement: 'top',
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 8 })
    ],
    whileElementsMounted: autoUpdate
  })

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
    
    // Go from the Sunday before the start date to today
    const startDate = new Date(oneYearAgo)
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)
    
    const totalDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      
      return {
        date,
        dateKey,
        count: completions[dateKey] || 0
      }
    })
  }, [completions])

  const monthLabels = useMemo(() => {
    const monthLabelsArray: { month: string; weekIndex: number }[] = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    days.forEach((day, dayIndex) => {
      if (dayIndex === 0 || day.date.getDate() === 1) {
        const weekIndex = Math.floor(dayIndex / 7)
        const month = day.date.getMonth()
        
        monthLabelsArray.push({
          month: monthNames[month],
          weekIndex: weekIndex
        })
      }
    })
    
    return monthLabelsArray
  }, [days])

  return (
    <div className="relative">
      <div className="relative mb-2 h-4">
        {monthLabels.map(({ month, weekIndex }) => (
          <span 
            key={`${month}-${weekIndex}`}
            className="absolute text-xs text-muted-foreground"
            style={{ 
              left: `${weekIndex * 16}px`
            }}
          >
            {month}
          </span>
        ))}
      </div>
      <div className="flex">
        <div className="flex flex-col gap-1 mr-2 text-xs text-muted-foreground">
          <div className="h-3"></div>
          <div className="h-3 flex items-center">Mon</div>
          <div className="h-3"></div>
          <div className="h-3 flex items-center">Wed</div>
          <div className="h-3"></div>
          <div className="h-3 flex items-center">Fri</div>
          <div className="h-3"></div>
        </div>
        <div 
          className="grid grid-rows-7 grid-flow-col gap-1"
          onMouseOver={(e) => {
            const dayElement = e.target as HTMLElement
            if (dayElement.dataset.date) {
              refs.setReference(dayElement)
              setTooltip({
                date: dayElement.dataset.date,
                count: parseInt(dayElement.dataset.count || '0')
              })
            }
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          {days.map(({ date, dateKey, count }) => (
            <HeatmapDay
              key={dateKey}
              date={date}
              count={count}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className="w-3 h-3 rounded-sm"
              style={getColorStyle(level)}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      {tooltip && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-50 px-3 py-2 text-sm bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
        >
          <HeatmapTooltip
            date={tooltip.date}
            count={tooltip.count}
          />
        </div>
      )}
    </div>
  )
}

function getColorStyle(level: number): React.CSSProperties {
  // GitHub's actual heatmap colors
  const colors = [
    { 
      lightBg: '#ebedf0', darkBg: '#161b22'  // Level 0 - Gray (no activity)
    },
    { 
      lightBg: '#9be9a8', darkBg: '#0e4429'  // Level 1 - Light green
    },
    { 
      lightBg: '#40c463', darkBg: '#006d32'  // Level 2 - Medium green
    },
    { 
      lightBg: '#30a14e', darkBg: '#26a641'  // Level 3 - Dark green
    },
    { 
      lightBg: '#216e39', darkBg: '#39d353'  // Level 4 - Darkest green
    }
  ]
  
  const colorIndex = Math.min(level, 4)
  const color = colors[colorIndex]
  
  return {
    backgroundColor: `light-dark(${color.lightBg}, ${color.darkBg})`
  }
}