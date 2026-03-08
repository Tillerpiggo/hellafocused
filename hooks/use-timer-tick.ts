"use client"
import { useState, useEffect, useCallback } from "react"
import { useFocusStore } from "@/store/focus-store"

interface TimerDisplay {
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

export function useTimerTick(sessionId: string | null): TimerDisplay | null {
  const timerEndTime = useFocusStore(s => {
    if (!sessionId) return null
    const session = s.sessions.find(ss => ss.id === sessionId)
    return session?.timerEndTime ?? null
  })
  const timerFired = useFocusStore(s => {
    if (!sessionId) return false
    const session = s.sessions.find(ss => ss.id === sessionId)
    return session?.timerFired ?? false
  })

  const [display, setDisplay] = useState<TimerDisplay | null>(null)

  const computeDisplay = useCallback(() => {
    if (!timerEndTime) {
      setDisplay(null)
      return
    }
    const remaining = timerEndTime - Date.now()
    if (remaining <= 0) {
      useFocusStore.setState(state => ({
        sessions: state.sessions.map(s =>
          s.id === sessionId
            ? { ...s, timerFired: true, timerEndTime: null }
            : s
        ),
      }))
      setDisplay(null)
      return
    }
    const isLastMinute = remaining < 60_000
    const label = formatRemaining(remaining)
    setDisplay({ label, isLastMinute })
  }, [timerEndTime, sessionId])

  useEffect(() => {
    if (!timerEndTime) {
      setDisplay(null)
      return
    }
    computeDisplay()
    const tickInterval = () => {
      const remaining = timerEndTime - Date.now()
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
  }, [timerEndTime, computeDisplay])

  if (timerFired) return null
  return display
}
