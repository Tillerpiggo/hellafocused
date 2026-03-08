"use client"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { XCircle } from "lucide-react"
import type React from "react"

interface TimerPickerProps {
  children: React.ReactNode
  hasActiveTimer: boolean
  timerEndTime?: number | null
  onSetTimer: (durationMs: number) => void
  onClearTimer: () => void
}

const MS_SECOND = 1000
const MS_MINUTE = 60 * MS_SECOND
const MS_HOUR = 60 * MS_MINUTE
const MS_DAY = 24 * MS_HOUR

const PRESETS = [
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

export function TimerPicker({ children, hasActiveTimer, timerEndTime, onSetTimer, onClearTimer }: TimerPickerProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customValue, setCustomValue] = useState("")
  const [customUnit, setCustomUnit] = useState<CustomUnit>("min")
  const [isOpen, setIsOpen] = useState(false)
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !timerEndTime) {
      setRemainingLabel(null)
      return
    }
    const update = () => {
      const remaining = timerEndTime - Date.now()
      if (remaining <= 0) {
        setRemainingLabel(null)
        return
      }
      setRemainingLabel(formatRemainingFull(remaining))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [isOpen, timerEndTime])

  const handleCustomSubmit = () => {
    const val = parseInt(customValue, 10)
    if (val >= 1 && val <= UNIT_MAX[customUnit]) {
      onSetTimer(val * UNIT_TO_MS[customUnit])
      setShowCustom(false)
      setCustomValue("")
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setShowCustom(false)
        setCustomValue("")
        setCustomUnit("min")
      }
    }}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {hasActiveTimer && (
          <>
            {remainingLabel && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground tabular-nums">
                {remainingLabel} remaining
              </div>
            )}
            <DropdownMenuItem onClick={onClearTimer} className="gap-2 cursor-pointer text-destructive">
              <XCircle className="h-4 w-4" />
              Cancel timer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {PRESETS.map(preset => (
          <DropdownMenuItem
            key={preset.ms}
            onClick={() => onSetTimer(preset.ms)}
            className="cursor-pointer"
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {!showCustom ? (
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault()
              setShowCustom(true)
            }}
          >
            Custom...
          </DropdownMenuItem>
        ) : (
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
