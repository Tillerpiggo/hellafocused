// Clock-time reminder helpers shared by the pending picker and sidebar menus.
// Kept React-free so the rollover logic stays trivially unit-testable.

/**
 * Milliseconds from `now` until the next occurrence of a wall-clock "HH:MM"
 * time — later today, or tomorrow if that time has already passed.
 * Returns null for unparsable or out-of-range input.
 */
export function msUntilClockTime(time: string, now: Date = new Date()): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null

  const target = new Date(now)
  target.setHours(hours, minutes, 0, 0)
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }
  return target.getTime() - now.getTime()
}

/**
 * Human label for when a clock-time reminder will actually fire,
 * e.g. "today 3:30 PM" or "tomorrow 9:00 AM". Null for invalid input.
 */
export function formatClockTimeTarget(time: string, now: Date = new Date()): string | null {
  const ms = msUntilClockTime(time, now)
  if (ms == null) return null
  const target = new Date(now.getTime() + ms)
  const day = target.getDate() === now.getDate() ? "today" : "tomorrow"
  const timeLabel = target.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  return `${day} ${timeLabel}`
}
