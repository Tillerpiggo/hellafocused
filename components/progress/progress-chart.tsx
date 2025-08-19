'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ProjectData, TaskData } from '@/lib/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
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
  const { theme } = useTheme()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly')
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">
          {getChartTitle()}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
              <DropdownMenuRadioItem value="daily">Daily</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="weekly">Weekly</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="monthly">Monthly</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            barCategoryGap="20%"
            onMouseMove={(e) => {
              console.log('activeTooltipIndex:', e.activeTooltipIndex, 'type:', typeof e.activeTooltipIndex)
              // Recharts types activeTooltipIndex as string | number | undefined, but it can be a string representation of a number
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
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? '#374151' : '#e2e8f0'} 
              opacity={0.5} 
            />
            <XAxis 
              dataKey="period" 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(59, 130, 246, 0.12)' }}
              allowEscapeViewBox={{ x: false, y: true }}
              animationDuration={200}
              position={{ x: undefined, y: 160 - toolTipYPosition }}
              offset={tooltipOffset}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
              }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{getTooltipLabel(String(label || ''))}</p>
                      <p style={{ margin: 0, color: '#3b82f6' }}>Tasks completed: {payload[0].value}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="tasks"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}