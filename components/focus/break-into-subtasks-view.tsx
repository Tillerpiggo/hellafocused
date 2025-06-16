"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/store/app-store"
import { ArrowDown, Send, X } from "lucide-react"

interface BreakIntoSubtasksViewProps {
  isVisible: boolean
  onClose: () => void
}

export function BreakIntoSubtasksView({ isVisible, onClose }: BreakIntoSubtasksViewProps) {
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [newSubtaskName, setNewSubtaskName] = useState("")
  const [animationClass, setAnimationClass] = useState("")
  const viewRef = useRef<HTMLDivElement>(null)
  const { breakTaskIntoSubtasks, currentFocusTask } = useAppStore()

  // Reset when view opens
  useEffect(() => {
    if (isVisible) {
      setSubtasks([])
      setNewSubtaskName("")
      setAnimationClass("animate-slide-up-in")
    } else {
      setAnimationClass("animate-slide-down-out")
    }
  }, [isVisible])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isVisible, onClose])

  // Handle touch swipe to dismiss
  useEffect(() => {
    if (!viewRef.current || !isVisible) return

    let startY = 0
    let currentY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      currentY = startY
    }

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY
      const diff = currentY - startY

      if (diff > 0) {
        // Swiping down
        viewRef.current!.style.transform = `translateY(${diff}px)`
      }
    }

    const handleTouchEnd = () => {
      const diff = currentY - startY
      if (diff > 100) {
        // Swipe threshold to dismiss
        onClose()
      } else {
        // Reset position
        viewRef.current!.style.transform = ""
      }
    }

    const element = viewRef.current
    element.addEventListener("touchstart", handleTouchStart)
    element.addEventListener("touchmove", handleTouchMove)
    element.addEventListener("touchend", handleTouchEnd)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isVisible, onClose])

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubtaskName.trim()) {
      setSubtasks([...subtasks, newSubtaskName.trim()])
      setNewSubtaskName("")
    }
  }

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    if (subtasks.length > 0) {
      breakTaskIntoSubtasks(subtasks)
      onClose()
    }
  }

  if (!isVisible) return null

  return (
    <div
      ref={viewRef}
      className={`fixed inset-0 bg-background z-50 transition-all duration-300 ease-out ${animationClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h1 className="text-2xl font-light">Break into Subtasks</h1>
        <Button variant="ghost" onClick={onClose}>
          <ArrowDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Current Task */}
      <div className="p-6 border-b">
        <div className="text-sm text-muted-foreground mb-1">Breaking down:</div>
        <div className="font-medium text-lg">{currentFocusTask?.name || ""}</div>
      </div>

      {/* Subtasks List */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {subtasks.length > 0 ? (
          <div className="space-y-2">
            {subtasks.map((subtask, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                <div className="flex-1">{subtask}</div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveSubtask(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">Add subtasks below to break down this task</div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-6 space-y-4">
        {/* Add Subtask Form */}
        <form onSubmit={handleAddSubtask} className="flex gap-3">
          <Input
            value={newSubtaskName}
            onChange={(e) => setNewSubtaskName(e.target.value)}
            placeholder="Add a subtask..."
            className="flex-1"
          />
          <Button type="submit" size="icon" className="rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={subtasks.length === 0}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Break into {subtasks.length} subtask{subtasks.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  )
}
