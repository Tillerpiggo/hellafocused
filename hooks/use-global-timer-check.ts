"use client"
import { useEffect } from "react"
import { useFocusStore } from "@/store/focus-store"

export function useGlobalTimerCheck() {
  useEffect(() => {
    const check = () => {
      const now = Date.now()
      const { sessions } = useFocusStore.getState()
      sessions.forEach(s => {
        if (s.timerEndTime && s.timerEndTime <= now && !s.timerFired) {
          useFocusStore.getState().fireTimer(s.id)
        }
      })
    }

    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [])
}
