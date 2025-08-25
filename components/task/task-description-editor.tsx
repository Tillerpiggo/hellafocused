"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Textarea } from "@/components/ui/textarea"

interface TaskDescriptionEditorProps {
  description?: string
  onSave: (description: string) => void
  onCancel: () => void
  placeholder?: string
}

export interface TaskDescriptionEditorRef {
  save: () => void
}

export const TaskDescriptionEditor = forwardRef<TaskDescriptionEditorRef, TaskDescriptionEditorProps>(({
  description = "",
  onSave,
  onCancel,
  placeholder = "Add a description..."
}, ref) => {
  const [value, setValue] = useState(description)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(value.length, value.length)
    }
  }, [])

  const handleSave = () => {
    console.log('TaskDescriptionEditor: handleSave called with value:', value.trim())
    onSave(value.trim())
  }

  useImperativeHandle(ref, () => ({
    save: handleSave
  }), [value])

  const handleCancel = () => {
    console.log('TaskDescriptionEditor: handleCancel called')
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

  return (
    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-900/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border-0 p-0 resize-none text-muted-foreground placeholder:text-muted-foreground/50 min-h-[80px] rounded-none"
          style={{
            outline: 'none !important',
            border: 'none !important',
            boxShadow: 'none !important',
            '--tw-ring-color': 'transparent',
            '--tw-ring-shadow': 'none'
          } as React.CSSProperties}
        />
      </div>
    </div>
  )
})

TaskDescriptionEditor.displayName = "TaskDescriptionEditor"