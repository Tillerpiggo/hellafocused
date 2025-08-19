'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ProjectData, TaskData } from '@/lib/types'

interface WeeklyProgressChartProps {
  projects: ProjectData[]
}

interface WeekData {
  week: string
  tasks: number
}

export function WeeklyProgressChart({ projects }: WeeklyProgressChartProps) {
  const { theme } = useTheme()
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
  
  const weeklyData = useMemo(() => {
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

    const formatWeekLabel = (weekStart: Date): string => {
      const month = weekStart.toLocaleDateString('en-US', { month: 'short' })
      const day = weekStart.getDate()
      return `${month} ${day}`
    }

    const weeks: WeekData[] = []
    
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
      
      const weekTasks = countTasksInRange(projects, weekStart, weekEnd)
      weeks.push({
        week: formatWeekLabel(weekStart),
        tasks: weekTasks
      })
    }
    
    return weeks
  }, [projects])

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium text-foreground mb-4">
        Weekly Progress
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={weeklyData} 
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
              dataKey="week" 
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
                      <p style={{ margin: 0, fontWeight: 'bold' }}>Week of {label}</p>
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