'use client'

import { useMemo, useState } from 'react'
import { ProjectData, TaskData } from '@/lib/types'
import { calculateTodaysTaskFocusPoints } from '@/lib/task-utils'
import { ProgressTask } from './progress-task'
import { Button } from '@/components/ui/button'

interface TodaysProgressCardProps {
  projects: ProjectData[]
}

export function TodaysProgressCard({ projects }: TodaysProgressCardProps) {
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
          // Count this task as 1 focus point (don't double count subtasks)
          totalFocusPoints += 1
          
          // Calculate focus points for this task and all its subtasks completed today
          const taskFocusPoints = calculateTodaysTaskFocusPoints(task)
          
          // Add to completed tasks with metadata
          completedTasks.push({
            ...task,
            projectName,
            path: currentPath,
            focusPoints: taskFocusPoints
          } as TaskData & { projectName: string; path: string[]; focusPoints: number })
        }
      }

      // Process subtasks
      task.subtasks.forEach(subtask => {
        processTask(subtask, projectName, currentPath)
      })
    }

    projects.forEach(project => {
      project.tasks.forEach(task => {
        processTask(task, project.name, [project.id])
      })
    })

    // Filter out tasks that have completed ancestors from today
    const topLevelTasks = completedTasks.filter(task => {
      const taskWithPath = task as TaskData & { path: string[] }
      // Check if this task has any completed ancestor from today
      return !completedTasks.some(potentialParent => {
        const parentWithPath = potentialParent as TaskData & { path: string[] }
        return parentWithPath.path.length < taskWithPath.path.length && 
        taskWithPath.path.slice(0, parentWithPath.path.length).join() === parentWithPath.path.join()
      })
    })

    // Sort tasks by completion time (most recent first)
    topLevelTasks.sort((a, b) => {
      if (!a.completionDate || !b.completionDate) return 0
      return new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
    })

    // Calculate historical averages for fire emoji logic
    const calculateDailyAverage = () => {
      const dailyTotals: number[] = []
      
      // Look at past 30 days (excluding today)
      for (let i = 1; i <= 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toDateString()
        
        let dayTotal = 0
        const countTasksForDate = (task: TaskData) => {
          if (task.completed && task.completionDate) {
            const taskDate = new Date(task.completionDate).toDateString()
            if (taskDate === dateString) {
              dayTotal += 1
            }
          }
          task.subtasks.forEach(countTasksForDate)
        }
        
        projects.forEach(project => {
          project.tasks.forEach(countTasksForDate)
        })
        
        dailyTotals.push(dayTotal)
      }
      
      return dailyTotals.length > 0 ? dailyTotals.reduce((sum, total) => sum + total, 0) / dailyTotals.length : 0
    }

    const dailyAverage = calculateDailyAverage()
    const isAboveAverage = totalFocusPoints > 0 && dailyAverage > 0 && totalFocusPoints >= dailyAverage * 1.2 // 20% above average

    return { 
      completedTasks: topLevelTasks, 
      totalFocusPoints, 
      isAboveAverage,
      dailyAverage: Math.round(dailyAverage * 10) / 10 // Round to 1 decimal
    }
  }, [projects])

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
            {todaysData.isAboveAverage && ' 🔥'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {(showAll ? todaysData.completedTasks : todaysData.completedTasks.slice(0, 6)).map((task) => {
          const taskWithPath = task as TaskData & { projectName: string; path: string[]; focusPoints: number }
          return (
            <ProgressTask
              key={taskWithPath.path.join('-')}
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