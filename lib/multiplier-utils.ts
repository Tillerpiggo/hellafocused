import type { TaskData, ProjectData, MultiplierResult, MultiplierBreakdown } from './types'
import { getTaskParentChain, findTaskAtPath, findTaskPath } from './task-utils'
import { startOfDay } from 'date-fns'

function isDueDateOnTrack(dueDate: string): boolean {
  const due = startOfDay(new Date(dueDate))
  const today = startOfDay(new Date())
  return due >= today
}

function isCompletedOnTime(task: TaskData): boolean {
  if (!task.dueDate) return false
  if (!task.completionDate) {
    return isDueDateOnTrack(task.dueDate)
  }
  const due = startOfDay(new Date(task.dueDate))
  const completed = startOfDay(new Date(task.completionDate))
  return completed <= due
}

export function calculateDueDateMultiplier(
  task: TaskData,
  projects: ProjectData[]
): MultiplierResult {
  const noBonus: MultiplierResult = { total: 1, breakdown: [] }

  if (!task.dueDate) return noBonus
  if (!isCompletedOnTime(task)) return noBonus

  const breakdown: MultiplierBreakdown[] = []

  breakdown.push({
    source: 'due-date-self',
    label: 'On time',
    multiplier: 2,
  })

  const parentChain = getTaskParentChain(projects, task.id)

  for (const ancestor of parentChain) {
    // Skip the project entry (first in chain) - projects don't have due dates
    const project = projects.find(p => p.id === ancestor.id)
    if (project) continue

    // Find the ancestor task to check its due date
    for (const proj of projects) {
      const pathInProject = findTaskPath(proj.tasks, ancestor.id)
      if (pathInProject) {
        const ancestorTask = findTaskAtPath(projects, [proj.id, ...pathInProject])
        if (ancestorTask?.dueDate && isDueDateOnTrack(ancestorTask.dueDate)) {
          breakdown.push({
            source: 'due-date-ancestor',
            label: ancestorTask.name.length > 16
              ? ancestorTask.name.slice(0, 14) + '…'
              : ancestorTask.name,
            multiplier: 2,
          })
        }
        break
      }
    }
  }

  const total = breakdown.reduce((acc, b) => acc * b.multiplier, 1)

  return { total, breakdown }
}

export function calculateTaskMultipliedPoints(task: TaskData, projects: ProjectData[]): number {
  if (!task.completed) return 0
  const { total } = calculateDueDateMultiplier(task, projects)
  return total
}
