// Reminder date/time helpers shared by the pending picker and sidebar menus.
// Kept React-free so the parsing logic stays trivially unit-testable.

const MS_HOUR = 60 * 60 * 1000
const MS_DAY = 24 * MS_HOUR

/** datetime-local input value for one hour from now — the default target. */
export function defaultReminderDateTime(now: Date = new Date()): string {
  return toDateTimeLocalValue(new Date(now.getTime() + MS_HOUR))
}

function toDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Milliseconds from `now` until a datetime-local value ("YYYY-MM-DDTHH:MM",
 * interpreted as local time). Null when unparsable or not in the future.
 */
export function msUntilDateTime(value: string, now: Date = new Date()): number | null {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  const ms = target.getTime() - now.getTime()
  return ms > 0 ? ms : null
}

/**
 * Human label for when the reminder will fire: "today 3:30 PM",
 * "tomorrow 9:00 AM", or "Mon, Jul 20, 9:00 AM" beyond that.
 * Null for invalid or past input.
 */
export function formatDateTimeTarget(value: string, now: Date = new Date()): string | null {
  const ms = msUntilDateTime(value, now)
  if (ms == null) return null
  const target = new Date(now.getTime() + ms)
  const timeLabel = target.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dayDiff = Math.round((dayStart(target) - dayStart(now)) / MS_DAY)
  if (dayDiff === 0) return `today ${timeLabel}`
  if (dayDiff === 1) return `tomorrow ${timeLabel}`
  const dateLabel = target.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  return `${dateLabel}, ${timeLabel}`
}
