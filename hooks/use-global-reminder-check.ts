"use client"
import { useEffect } from "react"
import { useFocusStore } from "@/store/focus-store"

export function useGlobalReminderCheck() {
  useEffect(() => {
    const check = () => {
      const now = Date.now()
      const { sessions } = useFocusStore.getState()
      sessions.forEach(s => {
        if (s.remindAt && s.remindAt <= now && !s.reminderFired) {
          useFocusStore.getState().fireReminder(s.id)
        }
      })
    }

    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [])
}
