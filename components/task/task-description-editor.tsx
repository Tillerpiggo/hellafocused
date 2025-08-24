"use client"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"

interface TaskDescriptionEditorProps {
  description?: string
  onSave: (description: string) => void
  onCancel: () => void
  placeholder?: string
}

export function TaskDescriptionEditor({
  description = "",
  onSave,
  onCancel,
  placeholder = "Add a description..."
}: TaskDescriptionEditorProps) {
  const [value, setValue] = useState(description)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(value.length, value.length)
    }
  }, [])

  const handleSave = () => {
    onSave(value.trim())
  }

  const handleCancel = () => {
    setValue(description)
    onCancel()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  return (
    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-900/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full bg-transparent border-0 p-0 resize-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground/50 min-h-[80px]"
        />
      </div>
    </div>
  )
}