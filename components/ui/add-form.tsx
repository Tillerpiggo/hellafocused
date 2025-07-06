"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AddFormProps {
  placeholder: string
  onSubmit: (value: string) => void
  inputId: string
}

// This is an input text field for adding tasks/subtasks quickly. Handles all styling/animation/ui logic.
export function AddForm({ placeholder, onSubmit, inputId }: AddFormProps) {
  const [value, setValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(20, textarea.scrollHeight)}px` // minimum 20px height
    }
  }, [value])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() !== "") {
      onSubmit(value.trim())
      setValue("")
      setIsFocused(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Enter without Shift submits the task
      e.preventDefault()
      e.stopPropagation()
      if (value.trim() !== "") {
        onSubmit(value.trim())
        setValue("")
        setIsFocused(false)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      setValue("")
      setIsFocused(false)
      // Blur the textarea to deselect it
      const textareaElement = textareaRef.current
      if (textareaElement) {
        textareaElement.blur()
      }
    }
    // Shift+Enter allows new line (default behavior)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={cn(
          "flex items-center justify-between p-3 my-1 rounded-md border-2 border-dashed border-muted-foreground/30 transition-all duration-150 min-h-[46px]", // Keep items-center for proper plus button centering
          isFocused || value
            ? "bg-background border-muted-foreground/50" // White background when focused
            : "hover:bg-accent hover:border-muted-foreground/50",
        )}
        onClick={() => {
          const textareaElement = textareaRef.current
          if (textareaElement) {
            textareaElement.focus()
            setIsFocused(true)
          }
        }}
      >
        <div className="flex items-center gap-3 flex-grow min-w-0">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            tabIndex={-1}
            className="h-7 w-7 flex-shrink-0 cursor-default" // Removed mt-0.5, let it center naturally
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
          </Button>
          <textarea
            ref={textareaRef}
            id={inputId}
            placeholder={placeholder}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              if (!value) {
                setIsFocused(false)
              }
            }}
            className="w-full resize-none border-none bg-transparent py-1 px-0 text-sm outline-none ring-0 shadow-none placeholder:text-muted-foreground rounded-none"
            style={{ 
              minHeight: '20px',
              lineHeight: '1.4',
              overflow: 'hidden'
            }}
            rows={1}
          />
        </div>
      </div>
    </form>
  )
} 