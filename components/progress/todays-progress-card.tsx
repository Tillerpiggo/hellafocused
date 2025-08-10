'use client'

import { useMemo } from 'react'
import { ProjectData, TaskData } from '@/lib/types'
import { ProgressTask } from './progress-task'

interface TodaysProgressCardProps {
  projects: ProjectData[]
}

export function TodaysProgressCard({ projects }: TodaysProgressCardProps) {
  const calculateTaskFocusPoints = (task: TaskData): number => {
    let points = task.completed ? 1 : 0
    task.subtasks.forEach(subtask => {
      points += calculateTaskFocusPoints(subtask)
    })
    return points
  }

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
          
          // Calculate focus points for this task and all its subtasks for display
          const taskFocusPoints = calculateTaskFocusPoints(task)
          
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

    // Sort tasks by completion time (earliest first)
    topLevelTasks.sort((a, b) => {
      if (!a.completionDate || !b.completionDate) return 0
      return new Date(a.completionDate).getTime() - new Date(b.completionDate).getTime()
    })

    return { completedTasks: topLevelTasks, totalFocusPoints }
  }, [projects, calculateTaskFocusPoints])

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
        </p>
      </div>
      
      <div className="space-y-1">
        {todaysData.completedTasks.map((task) => {
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
    </div>
  )
}