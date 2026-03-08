"use client"
import { useEffect } from "react"
import { useFocusStore } from "@/store/focus-store"

export function useGlobalTimerCheck() {
  useEffect(() => {
    const check = () => {
      const now = Date.now()
      const { sessions } = useFocusStore.getState()
      let changed = false
      const updated = sessions.map(s => {
        if (s.timerEndTime && s.timerEndTime <= now && !s.timerFired) {
          changed = true
          return { ...s, timerFired: true, timerEndTime: null }
        }
        return s
      })
      if (changed) {
        useFocusStore.setState({ sessions: updated })
      }
    }

    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [])
}
