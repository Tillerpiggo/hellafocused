"use client"

import { getDueStatus, formatDueDate, type DueStatus } from "@/lib/due-date-utils"
import { cn } from "@/lib/utils"

interface DueDateBadgeProps {
  dueDate: string
  dueSoonDays?: number
  className?: string
}

function getStatusStyles(status: DueStatus): string {
  switch (status) {
    case 'overdue':
      return 'text-due-overdue bg-due-overdueBg'
    case 'due-today':
      return 'text-due-today bg-due-todayBg'
    case 'due-soon':
      return 'text-due-soon bg-due-soonBg'
    case 'has-due-date':
      return 'text-due-future bg-due-futureBg'
    default:
      return ''
  }
}

export function DueDateBadge({ dueDate, dueSoonDays = 3, className }: DueDateBadgeProps) {
  const status = getDueStatus(dueDate, dueSoonDays)
  if (status === 'no-due-date') return null

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      getStatusStyles(status),
      className
    )}>
      {formatDueDate(dueDate)}
    </span>
  )
}
