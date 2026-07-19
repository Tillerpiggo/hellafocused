// Reminder date/time helpers shared by the pending picker and sidebar menus.
// The model: a reminder target is a DAY (today + offset) at a wall-clock time,
// which mirrors how people actually defer things ("this evening", "tomorrow
// morning"). Kept React-free so the logic stays trivially unit-testable.

const MS_HOUR = 60 * 60 * 1000

/** Anchors for the one-tap menu items. */
export const EVENING_TIME = "18:00"
export const MORNING_TIME = "09:00"

export interface DayOption {
  offset: number
  label: string
}

/** "Today" plus the next few days as short weekday labels, for day chips. */
export function nextDayOptions(count = 4, now: Date = new Date()): DayOption[] {
  const options: DayOption[] = []
  for (let offset = 0; offset < count; offset++) {
    const d = new Date(now)
    d.setDate(d.getDate() + offset)
    options.push({
      offset,
      label: offset === 0 ? "Today" : d.toLocaleDateString([], { weekday: "short" }),
    })
  }
  return options
}

/** Default chip + clock value for the custom row: one hour from now. */
export function defaultDayTime(now: Date = new Date()): { dayOffset: number; time: string } {
  const target = new Date(now.getTime() + MS_HOUR)
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    dayOffset: target.getDate() === now.getDate() ? 0 : 1,
    time: `${pad(target.getHours())}:${pad(target.getMinutes())}`,
  }
}

/**
 * Milliseconds from `now` until (today + dayOffset) at a wall-clock "HH:MM"
 * time, local. No rollover — the day is chosen explicitly — so a time that
 * has already passed on that day returns null.
 */
export function msUntilDayTime(dayOffset: number, time: string, now: Date = new Date()): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null

  const target = new Date(now)
  target.setDate(target.getDate() + dayOffset)
  target.setHours(hours, minutes, 0, 0)
  const ms = target.getTime() - now.getTime()
  return ms > 0 ? ms : null
}

/**
 * Human label for the resolved target: "today 6:30 PM", "tomorrow 9:00 AM",
 * or "Mon, Jul 20, 9:00 AM". Null when invalid or already past.
 */
export function formatDayTimeTarget(dayOffset: number, time: string, now: Date = new Date()): string | null {
  const ms = msUntilDayTime(dayOffset, time, now)
  if (ms == null) return null
  const target = new Date(now.getTime() + ms)
  const timeLabel = target.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  if (dayOffset === 0) return `today ${timeLabel}`
  if (dayOffset === 1) return `tomorrow ${timeLabel}`
  const dateLabel = target.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  return `${dateLabel}, ${timeLabel}`
}
