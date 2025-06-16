"use client"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import type React from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface EditableTitleProps {
  value: string
  onChange: (newValue: string) => void
  className?: string
  placeholder?: string
  isCompleted?: boolean
}

export interface EditableTitleRef {
  focus: () => void
  blur: () => void
}

export const EditableTitle = forwardRef<EditableTitleRef, EditableTitleProps>(
  ({ value, onChange, className, placeholder, isCompleted = false }, ref) => {
    const [editValue, setEditValue] = useState(value)
    const [isEditing, setIsEditing] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Expose methods to parent components
    useImperativeHandle(ref, () => ({
      focus: () => {
        if (textareaRef.current) {
          setIsEditing(true)
          textareaRef.current.focus()
          // Position cursor at the end without selecting all text
          setTimeout(() => {
            if (textareaRef.current) {
              const length = textareaRef.current.value.length
              textareaRef.current.setSelectionRange(length, length)
            }
          }, 0)
        }
      },
      blur: () => {
        if (textareaRef.current) {
          textareaRef.current.blur()
        }
      }
    }), [])

    useEffect(() => {
      setEditValue(value)
    }, [value])

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
      }
    }, [editValue])

    const handleSubmit = () => {
      // Always call onChange, even if the value hasn't changed
      onChange(editValue.trim() || value)
      setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
        if (textareaRef.current) {
          textareaRef.current.blur()
        }
      } else if (e.key === "Escape") {
        setEditValue(value)
        setIsEditing(false)
        if (textareaRef.current) {
          textareaRef.current.blur()
        }
      }
    }

    const handleFocus = () => {
      setIsEditing(true)
      // Use setTimeout to ensure the textarea is fully focused before selection
      setTimeout(() => {
        if (textareaRef.current) {
          // Position cursor at the end
          const length = textareaRef.current.value.length
          textareaRef.current.setSelectionRange(length, length)
        }
      }, 0)
    }

    const handleBlur = () => {
      handleSubmit()
    }

    return (
      <Textarea
        ref={textareaRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none cursor-pointer resize-none min-h-0 overflow-hidden",
          !isEditing && "cursor-pointer",
          isCompleted && "line-through text-muted-foreground opacity-70",
          className,
        )}
        placeholder={placeholder}
        rows={1}
      />
    )
  },
)

EditableTitle.displayName = "EditableTitle"
