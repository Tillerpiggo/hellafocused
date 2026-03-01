'use client'

import { useMemo, useState } from 'react'
import { ProjectData, TaskData } from '@/lib/types'
import { calculateTodaysTaskFocusPoints, isPathPrefix, serializePath } from '@/lib/task-utils'
import { ProgressTask } from './progress-task'
import { Button } from '@/components/ui/button'

interface TodaysProgressCardProps {
  projects: ProjectData[]
  completionsByDate: Map<string, number>
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function TodaysProgressCard({ projects, completionsByDate }: TodaysProgressCardProps) {
  const [showAll, setShowAll] = useState(false)

  const todaysData = useMemo(() => {
    const today = new Date().toDateString()
    const completedTasks: TaskData[] = []
    let totalFocusPoints = 0

    const processTask = (task: TaskData, projectName: string, parentPath: string[] = []) => {
      const currentPath = [...parentPath, task.id]

      if (task.completed && task.completionDate) {
        const taskDate = new Date(task.completionDate).toDateString()
        if (taskDate === today) {
          totalFocusPoints += 1
          const taskFocusPoints = calculateTodaysTaskFocusPoints(task)
          completedTasks.push({
            ...task,
            projectName,
            path: currentPath,
            focusPoints: taskFocusPoints
          } as TaskData & { projectName: string; path: string[]; focusPoints: number })
        }
      }

      task.subtasks.forEach(subtask => {
        processTask(subtask, projectName, currentPath)
      })
    }

    projects.forEach(project => {
      project.tasks.forEach(task => {
        processTask(task, project.name, [project.id])
      })
    })

    const topLevelTasks = completedTasks.filter(task => {
      const taskWithPath = task as TaskData & { path: string[] }
      return !completedTasks.some(potentialParent => {
        const parentWithPath = potentialParent as TaskData & { path: string[] }
        return parentWithPath.path.length < taskWithPath.path.length &&
        isPathPrefix(taskWithPath.path, parentWithPath.path)
      })
    })

    topLevelTasks.sort((a, b) => {
      if (!a.completionDate || !b.completionDate) return 0
      return new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
    })

    // Use pre-computed completionsByDate for the 30-day average
    let totalPast30 = 0
    for (let i = 1; i <= 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = getLocalDateKey(date)
      totalPast30 += completionsByDate.get(dateKey) || 0
    }
    const dailyAverage = totalPast30 / 30

    const isAboveAverage = totalFocusPoints > 0 && dailyAverage > 0 && totalFocusPoints >= dailyAverage * 1.2

    return {
      completedTasks: topLevelTasks,
      totalFocusPoints,
      isAboveAverage,
      dailyAverage: Math.round(dailyAverage * 10) / 10
    }
  }, [projects, completionsByDate])

  if (todaysData.completedTasks.length === 0) {
    return (
      <div className="w-full py-10 text-center">
        <p className="text-sm text-muted-foreground">No tasks completed yet today</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Today</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {todaysData.totalFocusPoints} point{todaysData.totalFocusPoints !== 1 ? 's' : ''}
            {todaysData.isAboveAverage && ' \ud83d\udd25'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {(showAll ? todaysData.completedTasks : todaysData.completedTasks.slice(0, 6)).map((task) => {
          const taskWithPath = task as TaskData & { projectName: string; path: string[]; focusPoints: number }
          return (
            <ProgressTask
              key={serializePath(taskWithPath.path)}
              task={taskWithPath}
              depth={0}
            />
          )
        })}
      </div>

      {todaysData.completedTasks.length > 6 && (
        <div className="flex justify-center mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showAll
              ? 'Show less'
              : `${todaysData.completedTasks.length - 6} more`
            }
          </Button>
        </div>
      )}
    </div>
  )
}
