'use client'

import { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ProjectData, TaskData } from '@/lib/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TimePeriod = 'daily' | 'weekly' | 'monthly'

interface ProgressChartProps {
  projects: ProjectData[]
}

interface ChartData {
  period: string
  tasks: number
}

export function ProgressChart({ projects }: ProgressChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly')

  const TimePeriodOption = ({ value, label }: { value: TimePeriod, label: string }) => (
    <DropdownMenuItem onClick={() => setTimePeriod(value)} className="pl-8 relative">
      {timePeriod === value && <Check className="h-4 w-4 opacity-50 absolute left-2" />}
      {label}
    </DropdownMenuItem>
  )
  const [activeBarIndex, setActiveBarIndex] = useState<number | undefined>()
  const [toolTipYPosition, setToolTipYPosition] = useState(0)
  const [tooltipOffset, setTooltipOffset] = useState(-60)

  useEffect(() => {
    if (activeBarIndex === undefined) return
    
    const barChart = document.querySelectorAll(".recharts-bar-rectangle")[activeBarIndex]
    if (barChart) {
      setToolTipYPosition(barChart.getBoundingClientRect().height)
    }

    const tooltipElement = document.querySelector(".recharts-tooltip-wrapper")
    if (tooltipElement) {
      const tooltipWidth = tooltipElement.getBoundingClientRect().width
      setTooltipOffset(-tooltipWidth / 2)
    }
  }, [activeBarIndex])
  
  const chartData = useMemo(() => {
    const countTasksInRange = (projects: ProjectData[], startDate: Date, endDate: Date): number => {
      let count = 0
      
      const countTask = (task: TaskData) => {
        if (task.completed && task.completionDate) {
          const completionDate = new Date(task.completionDate)
          if (completionDate >= startDate && completionDate <= endDate) {
            count += 1
          }
        }
        task.subtasks.forEach(countTask)
      }
      
      projects.forEach(project => {
        project.tasks.forEach(countTask)
      })
      
      return count
    }

    const generateDailyData = (): ChartData[] => {
      const data: ChartData[] = []
      
      // Generate past 30 days of data
      for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)
        
        const tasks = countTasksInRange(projects, date, endDate)
        const month = date.toLocaleDateString('en-US', { month: 'short' })
        const day = date.getDate()
        
        data.push({
          period: `${month} ${day}`,
          tasks
        })
      }
      
      return data
    }

    const generateWeeklyData = (): ChartData[] => {
      const data: ChartData[] = []
      
      // Generate past 52 weeks of data
      for (let i = 51; i >= 0; i--) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - (i * 7))
        // Set to start of week (Sunday = 0)
        const dayOfWeek = weekStart.getDay()
        weekStart.setDate(weekStart.getDate() - dayOfWeek)
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        
        const tasks = countTasksInRange(projects, weekStart, weekEnd)
        const month = weekStart.toLocaleDateString('en-US', { month: 'short' })
        const day = weekStart.getDate()
        
        data.push({
          period: `${month} ${day}`,
          tasks
        })
      }
      
      return data
    }

    const generateMonthlyData = (): ChartData[] => {
      const data: ChartData[] = []
      
      // Generate past 12 months of data
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date()
        monthStart.setMonth(monthStart.getMonth() - i)
        monthStart.setDate(1)
        monthStart.setHours(0, 0, 0, 0)
        
        const monthEnd = new Date(monthStart)
        monthEnd.setMonth(monthEnd.getMonth() + 1)
        monthEnd.setDate(0)
        monthEnd.setHours(23, 59, 59, 999)
        
        const tasks = countTasksInRange(projects, monthStart, monthEnd)
        const monthName = monthStart.toLocaleDateString('en-US', { month: 'long' })
        
        data.push({
          period: monthName,
          tasks
        })
      }
      
      return data
    }

    switch (timePeriod) {
      case 'daily':
        return generateDailyData()
      case 'weekly':
        return generateWeeklyData()
      case 'monthly':
        return generateMonthlyData()
      default:
        return generateWeeklyData()
    }
  }, [projects, timePeriod])

  const getChartTitle = () => {
    switch (timePeriod) {
      case 'daily':
        return 'Daily Progress'
      case 'weekly':
        return 'Weekly Progress'
      case 'monthly':
        return 'Monthly Progress'
      default:
        return 'Weekly Progress'
    }
  }

  const getTooltipLabel = (label: string) => {
    switch (timePeriod) {
      case 'daily':
        return label
      case 'weekly':
        return `Week of ${label}`
      case 'monthly':
        return label
      default:
        return `Week of ${label}`
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {getChartTitle()}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <TimePeriodOption value="monthly" label="Monthly" />
            <TimePeriodOption value="weekly" label="Weekly" />
            <TimePeriodOption value="daily" label="Daily" />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={timePeriod}
            data={chartData}
            barCategoryGap="25%"
            margin={{ top: 4, right: 4, bottom: 0, left: -12 }}
            onMouseMove={(e) => {
              const index = e.activeTooltipIndex
              if (typeof index === 'number') {
                setActiveBarIndex(index)
              } else if (typeof index === 'string' && !isNaN(Number(index))) {
                setActiveBarIndex(Number(index))
              } else {
                setActiveBarIndex(undefined)
              }
            }}
          >
            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--progress-grid))"
              strokeDasharray="none"
              opacity={0.6}
            />
            <XAxis
              dataKey="period"
              stroke="hsl(var(--progress-stroke))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              opacity={0.5}
            />
            <YAxis
              stroke="hsl(var(--progress-stroke))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              opacity={0.5}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
              allowEscapeViewBox={{ x: false, y: true }}
              animationDuration={150}
              position={{ x: undefined, y: 130 - toolTipYPosition }}
              offset={tooltipOffset}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{
                      backgroundColor: 'hsl(var(--card))',
                      border: `1px solid hsl(var(--border))`,
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                      padding: '6px 10px',
                      color: 'hsl(var(--card-foreground))'
                    }}>
                      <p style={{ margin: 0, opacity: 0.6, fontSize: '11px' }}>{getTooltipLabel(String(label || ''))}</p>
                      <p style={{ margin: '2px 0 0', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{payload[0].value} task{payload[0].value !== 1 ? 's' : ''}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="tasks"
              fill="hsl(var(--primary))"
              radius={[3, 3, 0, 0]}
              animationDuration={300}
              opacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}