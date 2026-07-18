"use client"
import { useState, useEffect, useCallback } from "react"
import { useFocusStore } from "@/store/focus-store"

interface ReminderDisplay {
  label: string
  isLastMinute: boolean
}

const MS_MINUTE = 60_000
const MS_HOUR = 60 * MS_MINUTE
const MS_DAY = 24 * MS_HOUR

function formatRemaining(ms: number): string {
  if (ms < MS_MINUTE) return `${Math.ceil(ms / 1000)}s`
  if (ms < MS_HOUR) return `${Math.ceil(ms / MS_MINUTE)}m`
  if (ms < MS_DAY) return `${Math.ceil(ms / MS_HOUR)}h`
  return `${Math.ceil(ms / MS_DAY)}d`
}

export function useReminderTick(sessionId: string | null): ReminderDisplay | null {
  const remindAt = useFocusStore(s => {
    if (!sessionId) return null
    const session = s.sessions.find(ss => ss.id === sessionId)
    return session?.remindAt ?? null
  })
  const reminderFired = useFocusStore(s => {
    if (!sessionId) return false
    const session = s.sessions.find(ss => ss.id === sessionId)
    return session?.reminderFired ?? false
  })

  const [display, setDisplay] = useState<ReminderDisplay | null>(null)

  const computeDisplay = useCallback(() => {
    if (!remindAt) {
      setDisplay(null)
      return
    }
    const remaining = remindAt - Date.now()
    if (remaining <= 0) {
      if (sessionId) useFocusStore.getState().fireReminder(sessionId)
      setDisplay(null)
      return
    }
    const isLastMinute = remaining < 60_000
    const label = formatRemaining(remaining)
    setDisplay({ label, isLastMinute })
  }, [remindAt, sessionId])

  useEffect(() => {
    if (!remindAt) {
      setDisplay(null)
      return
    }
    computeDisplay()
    const tickInterval = () => {
      const remaining = remindAt - Date.now()
      if (remaining > MS_HOUR) return 60_000
      if (remaining > MS_MINUTE) return 10_000
      return 1000
    }
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      computeDisplay()
      timer = setTimeout(tick, tickInterval())
    }
    timer = setTimeout(tick, tickInterval())
    return () => clearTimeout(timer)
  }, [remindAt, computeDisplay])

  if (reminderFired) return null
  return display
}
