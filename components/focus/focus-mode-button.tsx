"use client"
import { Button } from "@/components/ui/button"
import { Target } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { useEffect, useState } from "react"

export function FocusModeButton() {
  const enterFocusMode = useAppStore((state) => state.enterFocusMode)
  const isFocusMode = useAppStore((state) => state.isFocusMode)
  const exitFocusMode = useAppStore((state) => state.exitFocusMode)
  const [isVisible, setIsVisible] = useState(!isFocusMode)

  useEffect(() => {
    if (!isFocusMode) {
      setIsVisible(true)
      return
    }

    // Initially hide the button in focus mode
    setIsVisible(false)

    let timeout: NodeJS.Timeout

    const handleMouseMove = () => {
      setIsVisible(true)

      // Clear any existing timeout
      if (timeout) {
        clearTimeout(timeout)
      }

      // Set a new timeout to hide the button after 2 seconds of no movement
      timeout = setTimeout(() => {
        setIsVisible(false)
      }, 2000)
    }

    // Add event listener
    window.addEventListener("mousemove", handleMouseMove)

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [isFocusMode])

  const handleClick = () => {
    if (isFocusMode) {
      exitFocusMode()
    } else {
      enterFocusMode() // Store handles logic if project not selected
    }
  }

  return (
    <Button
      variant={isFocusMode ? "secondary" : "default"}
      size="lg"
      className={`fixed top-6 right-6 shadow-xl rounded-lg p-4 h-auto transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      } hover:scale-105 hover:shadow-2xl`}
      onClick={handleClick}
    >
      <Target className="h-6 w-6 mr-2" />
      {isFocusMode ? "Stop Focus" : "Focus"}
    </Button>
  )
}
