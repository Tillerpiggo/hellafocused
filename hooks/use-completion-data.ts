import { useMemo } from 'react'
import type { ProjectData, TaskData } from '@/lib/types'
import { calculateTaskMultipliedPoints } from '@/lib/multiplier-utils'

function getLocalDateString(utcDateString: string): string {
  const date = new Date(utcDateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface CompletionData {
  completionsByDate: Map<string, number>
  totalPoints: number
}

export function useCompletionData(projects: ProjectData[]): CompletionData {
  return useMemo(() => {
    const completionsByDate = new Map<string, number>()
    let totalPoints = 0

    const processTask = (task: TaskData) => {
      if (task.completed && task.completionDate) {
        const points = calculateTaskMultipliedPoints(task, projects)
        totalPoints += points
        const dateKey = getLocalDateString(task.completionDate)
        completionsByDate.set(dateKey, (completionsByDate.get(dateKey) || 0) + points)
      }
      task.subtasks.forEach(processTask)
    }

    projects.forEach(project => {
      project.tasks.forEach(processTask)
    })

    return { completionsByDate, totalPoints }
  }, [projects])
}
