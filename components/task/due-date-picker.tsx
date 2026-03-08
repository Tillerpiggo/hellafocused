"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getDueStatus, formatDueDateFull } from "@/lib/due-date-utils"
import { cn } from "@/lib/utils"

interface DueDatePickerProps {
  dueDate?: string
  onDateChange: (date: string | undefined) => void
  triggerClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  children?: React.ReactNode
}

function getIconColor(dueDate?: string): string {
  if (!dueDate) return 'text-muted-foreground'
  const status = getDueStatus(dueDate)
  switch (status) {
    case 'overdue': return 'text-due-overdue'
    case 'due-today': return 'text-due-today'
    case 'due-soon': return 'text-due-soon'
    default: return 'text-due-future'
  }
}

export function DueDatePicker({ dueDate, onDateChange, triggerClassName, open, onOpenChange, hideTrigger, children }: DueDatePickerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen

  const selected = dueDate ? new Date(dueDate) : undefined

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      const iso = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 0, 0).toISOString()
      onDateChange(iso)
    } else {
      onDateChange(undefined)
    }
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children ? children : hideTrigger ? (
          <span className="sr-only" />
        ) : (
          <button
            className={cn(
              "inline-flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-accent",
              getIconColor(dueDate),
              triggerClassName
            )}
            title={dueDate ? formatDueDateFull(dueDate) : "Set due date"}
          >
            <Calendar className="h-4 w-4" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start" sideOffset={8}>
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          className="rdp-theme"
        />
        {dueDate && (
          <div className="border-t border-border pt-2 mt-2">
            <button
              onClick={() => {
                onDateChange(undefined)
                setIsOpen(false)
              }}
              className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors py-1 rounded-md hover:bg-accent"
            >
              Clear due date
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
