"use client"

import { useState, useRef, useEffect } from "react"
import { Paperclip, Link, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TaskDescriptionFieldProps {
  taskPath: string[]
  taskName: string
}

export function TaskDescriptionField({ taskPath, taskName }: TaskDescriptionFieldProps) {
  const [description, setDescription] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Generate fake description based on task name (empty by default for new tasks)
  useEffect(() => {
    // Simulate loading existing description (would come from backend)
    // For demo, some tasks have descriptions, some don't
    const hasExistingDescription = taskPath.length % 3 === 0
    if (hasExistingDescription) {
      const fakeDescriptions = [
        `This task involves working on ${taskName}. Consider breaking this down into smaller subtasks if needed.`,
        `Remember to review the requirements for ${taskName} before starting implementation.`,
        `${taskName} is a critical component of the current sprint.`,
      ]
      const index = taskPath.reduce((acc, part) => acc + part.length, 0) % fakeDescriptions.length
      setDescription(fakeDescriptions[index])
    }
  }, [taskPath, taskName])
  
  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [description])
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    // In real implementation, this would debounce and save to backend
  }
  
  const handleToolbarAction = (action: string) => {
    // Placeholder for toolbar actions
    console.log(`${action} clicked - coming soon`)
  }
  
  return (
    <div className="space-y-2">
      {/* Description Field */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Add a description..."
          spellCheck={false}
          rows={1}
          className={cn(
            "w-full resize-none",
            "bg-transparent",
            "border-0",
            "text-sm text-muted-foreground leading-relaxed",
            "placeholder:text-muted-foreground/60",
            "focus:outline-none focus:ring-0",
            "transition-all duration-200"
          )}
          style={{ 
            fontFamily: 'inherit',
          }}
        />
      </div>
      
      {/* Toolbar - Always Visible */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToolbarAction("attach")}
          className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
          title="Add attachment (coming soon)"
        >
          <Paperclip className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-xs">Attach</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToolbarAction("link")}
          className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
          title="Add link (coming soon)"
        >
          <Link className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-xs">Link</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToolbarAction("duedate")}
          className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
          title="Set due date (coming soon)"
        >
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-xs">Due date</span>
        </Button>
      </div>
      
      {/* Temporary: Show when features are clicked */}
      {false && (
        <div className="text-xs text-muted-foreground italic px-3">
          These features are coming soon. Description auto-saves as you type.
        </div>
      )}
    </div>
  )
}