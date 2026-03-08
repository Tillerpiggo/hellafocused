import { startOfDay, isToday, isTomorrow, isYesterday, isPast, differenceInCalendarDays, format } from 'date-fns'
import { TaskData } from './types'

export type DueStatus = 'overdue' | 'due-today' | 'due-soon' | 'has-due-date' | 'no-due-date'

export const DEFAULT_DUE_SOON_DAYS = 3

export function getDueStatus(dueDate: string | undefined, dueSoonDays: number = DEFAULT_DUE_SOON_DAYS): DueStatus {
  if (!dueDate) return 'no-due-date'

  const due = startOfDay(new Date(dueDate))
  const today = startOfDay(new Date())

  if (isToday(due)) return 'due-today'
  if (isPast(due)) return 'overdue'

  const daysUntil = differenceInCalendarDays(due, today)
  if (daysUntil <= dueSoonDays) return 'due-soon'

  return 'has-due-date'
}

export function formatDueDate(dueDate: string): string {
  const due = startOfDay(new Date(dueDate))
  const today = startOfDay(new Date())

  if (isToday(due)) return 'Today'
  if (isTomorrow(due)) return 'Tomorrow'

  const diff = differenceInCalendarDays(due, today)

  if (diff < 0) {
    if (isYesterday(due)) return 'Yesterday'
    const absDiff = Math.abs(diff)
    return `${absDiff}d overdue`
  }

  if (diff < 7) return format(due, 'EEEE')

  return format(due, 'MMM d')
}

export function formatDueDateFull(dueDate: string): string {
  const due = new Date(dueDate)
  return format(due, 'EEE, MMM d, yyyy')
}

export function isImminentTask(task: TaskData): boolean {
  if (!task.dueDate || task.completed) return false
  const status = getDueStatus(task.dueDate)
  return status === 'overdue' || status === 'due-today'
}

export function getEarliestDueDate(tasks: TaskData[]): string | undefined {
  let earliest: string | undefined
  for (const task of tasks) {
    if (task.dueDate && !task.completed) {
      if (!earliest || new Date(task.dueDate) < new Date(earliest)) {
        earliest = task.dueDate
      }
    }
  }
  return earliest
}
