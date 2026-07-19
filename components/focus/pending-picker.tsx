"use client"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Check, CheckCircle2, Hourglass } from "lucide-react"
import { defaultReminderDateTime, msUntilDateTime, formatDateTimeTarget } from "@/lib/pending-time"
import type React from "react"

interface PendingPickerProps {
  children: React.ReactNode
  isPending: boolean
  remindAt?: number | null
  onMarkPending: (remindInMs: number | null) => void
  onResolve: () => void
}

const MS_SECOND = 1000
const MS_MINUTE = 60 * MS_SECOND
const MS_HOUR = 60 * MS_MINUTE
const MS_DAY = 24 * MS_HOUR

export const PENDING_PRESETS = [
  { label: "1 min", ms: MS_MINUTE },
  { label: "5 min", ms: 5 * MS_MINUTE },
  { label: "15 min", ms: 15 * MS_MINUTE },
  { label: "1 hour", ms: MS_HOUR },
  { label: "4 hours", ms: 4 * MS_HOUR },
  { label: "1 day", ms: MS_DAY },
  { label: "1 week", ms: 7 * MS_DAY },
]

type CustomUnit = "min" | "hours" | "days"

const UNIT_TO_MS: Record<CustomUnit, number> = {
  min: MS_MINUTE,
  hours: MS_HOUR,
  days: MS_DAY,
}

const UNIT_MAX: Record<CustomUnit, number> = {
  min: 480,
  hours: 72,
  days: 30,
}

export function formatRemainingFull(ms: number): string {
  if (ms <= 0) return "0s"
  const parts: string[] = []
  const days = Math.floor(ms / MS_DAY)
  if (days > 0) parts.push(`${days}d`)
  const hours = Math.floor((ms % MS_DAY) / MS_HOUR)
  if (hours > 0) parts.push(`${hours}h`)
  const mins = Math.floor((ms % MS_HOUR) / MS_MINUTE)
  if (mins > 0) parts.push(`${mins}m`)
  const secs = Math.floor((ms % MS_MINUTE) / MS_SECOND)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  return parts.join(" ")
}

// Inline date+time row shared by the picker and the sidebar submenus. Lives
// inside menu content, so it stops click/key propagation to keep the menu open
// and its typeahead from stealing keystrokes. The check is always armed — the
// input opens prefilled with a valid default, and onSubmit guards stragglers.
function ClockTimeInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}) {
  const targetLabel = formatDateTimeTarget(value)
  return (
    <div className="w-52 px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1.5">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit()
            e.stopPropagation()
          }}
          autoFocus
          aria-label="Reminder date and time"
          className="min-w-0 flex-1 rounded border border-foreground/20 bg-transparent px-2 py-1 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSubmit()
          }}
          aria-label="Set reminder"
          title="Set reminder"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Check className="h-4 w-4" />
        </button>
      </div>
      {targetLabel && (
        <div className="mt-1 text-xs text-muted-foreground">{targetLabel}</div>
      )}
    </div>
  )
}

export function PendingPicker({ children, isPending, remindAt, onMarkPending, onResolve }: PendingPickerProps) {
  const [customMode, setCustomMode] = useState<"duration" | "time" | null>(null)
  const [customValue, setCustomValue] = useState("")
  const [customUnit, setCustomUnit] = useState<CustomUnit>("min")
  const [timeValue, setTimeValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !remindAt) {
      setRemainingLabel(null)
      return
    }
    const update = () => {
      const remaining = remindAt - Date.now()
      if (remaining <= 0) {
        setRemainingLabel(null)
        return
      }
      setRemainingLabel(formatRemainingFull(remaining))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [isOpen, remindAt])

  const handleCustomSubmit = () => {
    const val = parseInt(customValue, 10)
    if (val >= 1 && val <= UNIT_MAX[customUnit]) {
      onMarkPending(val * UNIT_TO_MS[customUnit])
      setCustomMode(null)
      setCustomValue("")
    }
  }

  const handleTimeSubmit = () => {
    const ms = msUntilDateTime(timeValue)
    if (ms == null) return
    onMarkPending(ms)
    setCustomMode(null)
    setTimeValue("")
  }

  return (
    <DropdownMenu onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setCustomMode(null)
        setCustomValue("")
        setCustomUnit("min")
        setTimeValue("")
      }
    }}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isPending && (
          <>
            {remainingLabel && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground tabular-nums">
                {remainingLabel} until reminder
              </div>
            )}
            <DropdownMenuItem onClick={onResolve} className="gap-2 cursor-pointer">
              <CheckCircle2 className="h-4 w-4" />
              Resolve
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {isPending ? "Remind again in" : "Pending — remind in"}
        </div>
        {PENDING_PRESETS.map(preset => (
          <DropdownMenuItem
            key={preset.ms}
            onClick={() => onMarkPending(preset.ms)}
            className="cursor-pointer"
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => onMarkPending(null)}
          className="cursor-pointer text-muted-foreground"
        >
          No reminder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {customMode === null && (
          <>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault()
                setCustomMode("duration")
              }}
            >
              Custom...
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault()
                setTimeValue(defaultReminderDateTime())
                setCustomMode("time")
              }}
            >
              At a time...
            </DropdownMenuItem>
          </>
        )}
        {customMode === "duration" && (
          <div className="px-2 py-1.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              min={1}
              max={UNIT_MAX[customUnit]}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCustomSubmit()
                e.stopPropagation()
              }}
              placeholder="#"
              autoFocus
              className="w-14 text-sm px-2 py-1 rounded border border-foreground/20 bg-transparent outline-none focus:border-primary"
            />
            <select
              value={customUnit}
              onChange={(e) => {
                setCustomUnit(e.target.value as CustomUnit)
                setCustomValue("")
              }}
              className="text-xs px-1 py-1 rounded border border-foreground/20 bg-transparent outline-none focus:border-primary"
            >
              <option value="min">min</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
          </div>
        )}
        {customMode === "time" && (
          <ClockTimeInput value={timeValue} onChange={setTimeValue} onSubmit={handleTimeSubmit} />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Structural props so the sidebar's DropdownMenu and ContextMenu families can
// share one implementation of the pending submenu.
type MenuSubComponent = React.ComponentType<{
  children?: React.ReactNode
  onOpenChange?: (open: boolean) => void
}>

type MenuItemComponent = React.ComponentType<{
  children?: React.ReactNode
  className?: string
  onClick?: () => void
  onSelect?: (event: Event) => void
}>

interface PendingReminderSubmenuProps {
  Sub: MenuSubComponent
  SubTrigger: React.ComponentType<{ children?: React.ReactNode }>
  SubContent: React.ComponentType<{ children?: React.ReactNode }>
  Item: MenuItemComponent
  Separator: React.ComponentType<{ className?: string }>
  isPending: boolean
  onMarkPending: (remindInMs: number | null) => void
}

export function PendingReminderSubmenu({
  Sub,
  SubTrigger,
  SubContent,
  Item,
  Separator,
  isPending,
  onMarkPending,
}: PendingReminderSubmenuProps) {
  const [showTime, setShowTime] = useState(false)
  const [timeValue, setTimeValue] = useState("")

  const reset = () => {
    setShowTime(false)
    setTimeValue("")
  }

  const handleTimeSubmit = () => {
    const ms = msUntilDateTime(timeValue)
    if (ms == null) return
    onMarkPending(ms)
    reset()
  }

  return (
    <Sub onOpenChange={(open) => { if (!open) reset() }}>
      <SubTrigger>
        <Hourglass className="mr-2 h-4 w-4" />
        {isPending ? "Remind again" : "Mark pending"}
      </SubTrigger>
      <SubContent>
        {PENDING_PRESETS.map(preset => (
          <Item key={preset.ms} onClick={() => onMarkPending(preset.ms)} className="cursor-pointer">
            {preset.label}
          </Item>
        ))}
        <Item onClick={() => onMarkPending(null)} className="cursor-pointer text-muted-foreground">
          No reminder
        </Item>
        <Separator />
        {!showTime ? (
          <Item
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault()
              setTimeValue(defaultReminderDateTime())
              setShowTime(true)
            }}
          >
            At a time...
          </Item>
        ) : (
          <ClockTimeInput value={timeValue} onChange={setTimeValue} onSubmit={handleTimeSubmit} />
        )}
      </SubContent>
    </Sub>
  )
}
