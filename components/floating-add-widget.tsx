"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/store/app-store"
import { Send } from "lucide-react"
import { isProjectList } from "@/lib/task-utils"

export function FloatingAddWidget() {
  const [taskName, setTaskName] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { currentPath, addSubtaskToParent, isFocusMode } = useAppStore()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [taskName])

  // Handle escape key to clear input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTaskName("")
        textareaRef.current?.blur()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (taskName.trim() && !isProjectList(currentPath)) {
      addSubtaskToParent(currentPath, taskName.trim())
      setTaskName("")
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Don't show in focus mode or when at project list
  if (isFocusMode || isProjectList(currentPath)) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl px-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-border/20 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3 items-start">
          <Textarea
            ref={textareaRef}
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add subtask..."
            className="flex-1 border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm resize-none min-h-[20px] max-h-32 overflow-y-auto"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex-shrink-0 mt-0.5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
