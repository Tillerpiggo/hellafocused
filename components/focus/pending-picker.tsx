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
import { cn } from "@/lib/utils"
import {
  EVENING_TIME,
  MORNING_TIME,
  nextDayOptions,
  defaultDayTime,
  msUntilDayTime,
  formatDayTimeTarget,
} from "@/lib/pending-time"
import type React from "react"

interface PendingPickerProps {
  children: React.ReactNode
  isPending: boolean
  remindAt?: number | null
  onMarkPending: (remindInMs: number | null) => void
  onResolve: () => void
}

// Structural props so the sidebar's DropdownMenu and ContextMenu families can
// share the menu-item fragments below.
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

const MS_SECOND = 1000
const MS_MINUTE = 60 * MS_SECOND
const MS_HOUR = 60 * MS_MINUTE
const MS_DAY = 24 * MS_HOUR

// Short deferrals, then day-anchored one-taps, then long horizons.
export const PENDING_PRESETS = [
  { label: "1 min", ms: MS_MINUTE },
  { label: "5 min", ms: 5 * MS_MINUTE },
  { label: "15 min", ms: 15 * MS_MINUTE },
  { label: "1 hour", ms: MS_HOUR },
  { label: "4 hours", ms: 4 * MS_HOUR },
]

const PENDING_LONG_PRESETS = [
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

// One-tap day anchors — the most common "ping me then" intents. "This
// evening" disappears once that time has passed.
function AnchoredReminderItems({
  Item,
  onMarkPending,
}: {
  Item: MenuItemComponent
  onMarkPending: (remindInMs: number) => void
}) {
  const eveningMs = msUntilDayTime(0, EVENING_TIME)
  const morningMs = msUntilDayTime(1, MORNING_TIME)
  return (
    <>
      {eveningMs != null && (
        <Item className="cursor-pointer" onClick={() => onMarkPending(eveningMs)}>
          This evening · 6 PM
        </Item>
      )}
      {morningMs != null && (
        <Item className="cursor-pointer" onClick={() => onMarkPending(morningMs)}>
          Tomorrow morning · 9 AM
        </Item>
      )}
    </>
  )
}

// The custom row: a day chip strip plus a clean clock field — no calendar
// widget. Self-contained (owns day+time state, prefilled to now+1h) so it can
// live inside any menu; it stops click/key propagation to keep that menu open
// and its typeahead from stealing keystrokes. The primary check is always
// armed and only submits when the target is genuinely in the future.
function CustomReminderInput({ onSubmit }: { onSubmit: (ms: number) => void }) {
  const [defaults] = useState(() => defaultDayTime())
  const [dayOffset, setDayOffset] = useState(defaults.dayOffset)
  const [time, setTime] = useState(defaults.time)

  const ms = msUntilDayTime(dayOffset, time)
  const hint = ms != null ? formatDayTimeTarget(dayOffset, time) : null
  const submit = () => {
    if (ms != null) onSubmit(ms)
  }

  return (
    <div className="w-56 px-2 py-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-1">
        {nextDayOptions(4).map(day => (
          <button
            key={day.offset}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setDayOffset(day.offset)
            }}
            aria-pressed={day.offset === dayOffset}
            className={cn(
              "h-6 flex-1 rounded-md text-xs font-medium transition-colors",
              day.offset === dayOffset
                ? "bg-primary text-primary-foreground"
                : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
            )}
          >
            {day.label}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit()
            e.stopPropagation()
          }}
          autoFocus
          aria-label="Reminder time"
          className="min-w-0 flex-1 rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            submit()
          }}
          aria-label="Set reminder"
          title="Set reminder"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Check className="h-4 w-4" />
        </button>
      </div>
      <div className={cn("mt-1.5 text-xs", hint ? "text-muted-foreground" : "text-destructive/80")}>
        {hint ?? "That time has passed — pick a later one"}
      </div>
    </div>
  )
}

export function PendingPicker({ children, isPending, remindAt, onMarkPending, onResolve }: PendingPickerProps) {
  const [customMode, setCustomMode] = useState<"duration" | "time" | null>(null)
  const [customValue, setCustomValue] = useState("")
  const [customUnit, setCustomUnit] = useState<CustomUnit>("min")
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

  return (
    <DropdownMenu onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setCustomMode(null)
        setCustomValue("")
        setCustomUnit("min")
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
          {isPending ? "Remind again" : "Pending — remind me"}
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
        <AnchoredReminderItems Item={DropdownMenuItem} onMarkPending={onMarkPending} />
        {PENDING_LONG_PRESETS.map(preset => (
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
          <CustomReminderInput
            onSubmit={(ms) => {
              onMarkPending(ms)
              setCustomMode(null)
            }}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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

  const reset = () => setShowTime(false)

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
        <AnchoredReminderItems Item={Item} onMarkPending={onMarkPending} />
        {PENDING_LONG_PRESETS.map(preset => (
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
              setShowTime(true)
            }}
          >
            At a time...
          </Item>
        ) : (
          <CustomReminderInput
            onSubmit={(ms) => {
              onMarkPending(ms)
              reset()
            }}
          />
        )}
      </SubContent>
    </Sub>
  )
}
