'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
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

// Convert UTC ISO string to local date string (YYYY-MM-DD)
function getLocalDateString(utcDateString: string): string {
  const date = new Date(utcDateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Convert a local date to local date string (YYYY-MM-DD)
function dateToLocalString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function CompletionHeatmap({ projects }: CompletionHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
        const dateKey = getLocalDateString(task.completionDate)
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
      const dateKey = dateToLocalString(date)
      
      return {
        date,
        dateKey,
        count: completions[dateKey] || 0
      }
    })
  }, [completions])

  const normalDistributionThresholds = useMemo(() => {
    const activeDays = days.map(day => day.count).filter(count => count > 0)
    
    const mean = activeDays.reduce((sum, count) => sum + count, 0) / activeDays.length
    const variance = activeDays.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / activeDays.length
    const stdDev = Math.sqrt(variance)
    
    // z-scores for 30th, 80th, 95th percentiles
    const zScores = [-0.5244, 0.8416, 1.6449]
    
    const thresholds = [0, ...zScores.map(z => mean + z * stdDev)] // [0, 30th percentile, 80th percentile, 95th percentile]
    
    return thresholds
  }, [days])

  const getIntensityLevel = (count: number): number => {
    if (count === 0) return 0
    if (count <= normalDistributionThresholds[1]) return 1
    if (count <= normalDistributionThresholds[2]) return 2
    if (count <= normalDistributionThresholds[3]) return 3
    return 4
  }

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

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth
    }
  }, [days])

  return (
    <div className="w-full">
      <div className="overflow-x-auto min-w-0" ref={scrollContainerRef}>
        <div>
          {/* Month labels */}
          <div className="relative mb-2 h-4 ml-10">
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
            {/* Fixed-width days labels */}
            <div className="flex flex-col gap-1 mr-2 text-xs text-muted-foreground flex-shrink-0 w-8">
              <div className="h-3"></div>
              <div className="h-3 flex items-center">Mon</div>
              <div className="h-3"></div>
              <div className="h-3 flex items-center">Wed</div>
              <div className="h-3"></div>
              <div className="h-3 flex items-center">Fri</div>
              <div className="h-3"></div>
            </div>
            
            {/* Heatmap grid */}
            <div 
              className="grid grid-rows-7 grid-flow-col gap-1"
              style={{ minWidth: `${Math.ceil(days.length / 7) * 16}px` }}
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
                  level={getIntensityLevel(count)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-muted-foreground/60">
        <span>Less</span>
        <div className="flex gap-[3px]">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`w-[10px] h-[10px] rounded-[2px] ${getColorClass(level)}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      {tooltip && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-50 px-3 py-2 text-sm bg-popover text-popover-foreground rounded-lg shadow-lg border pointer-events-none whitespace-nowrap"
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

function getColorClass(level: number): string {
  const classes = [
    'bg-heatmap-0',  // Level 0 - Gray (no activity)
    'bg-heatmap-1',  // Level 1
    'bg-heatmap-2',  // Level 2
    'bg-heatmap-3',  // Level 3
    'bg-heatmap-4',  // Level 4
  ]
  
  const colorIndex = Math.min(level, 4)
  return classes[colorIndex]
}