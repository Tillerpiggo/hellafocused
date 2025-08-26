'use client'

import { useMemo, useState } from 'react'
import { ProjectData, TaskData } from '@/lib/types'
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
          
          // Calculate focus points only for subtasks completed today
          const calculateTodaysFocusPoints = (task: TaskData): number => {
            let points = 0
            // Count this task (already verified it was completed today)
            if (task.completed && task.completionDate) {
              const taskDate = new Date(task.completionDate).toDateString()
              if (taskDate === today) {
                points = 1
              }
            }
            // Count subtasks completed today
            task.subtasks.forEach(subtask => {
              points += calculateTodaysFocusPoints(subtask)
            })
            return points
          }
          
          const taskFocusPoints = calculateTodaysFocusPoints(task)
          
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
      <div className="w-full p-6 bg-muted/30 rounded-xl border">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">Today&apos;s Progress</h3>
          <p className="text-muted-foreground">No tasks completed yet today</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6 bg-muted/30 rounded-xl border">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-foreground mb-1">Today&apos;s Progress</h3>
        <p className="text-muted-foreground">
          {todaysData.totalFocusPoints} focus point{todaysData.totalFocusPoints !== 1 ? 's' : ''} earned
          {todaysData.isAboveAverage && <span className="ml-2">🔥</span>}
        </p>
        {todaysData.isAboveAverage && (
          <p className="text-xs text-muted-foreground mt-1">
            Above your {todaysData.dailyAverage} daily average - you&apos;re on fire! 
          </p>
        )}
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
      
      {/* Show more/less button */}
      {todaysData.completedTasks.length > 6 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showAll 
              ? 'Show less' 
              : `Show ${todaysData.completedTasks.length - 6} more`
            }
          </Button>
        </div>
      )}
    </div>
  )
}