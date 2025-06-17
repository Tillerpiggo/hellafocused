"use client"
import { useState } from "react"
import type React from "react"

import { Input } from "@/components/ui/input"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() !== "") {
      onSubmit(value.trim())
      setValue("")
      setIsFocused(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setValue("")
      setIsFocused(false)
      // Blur the input to deselect it
      const inputElement = document.getElementById(inputId)
      if (inputElement) {
        inputElement.blur()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={cn(
          "flex items-center justify-between p-3 my-1 rounded-md border-2 border-dashed border-muted-foreground/30 transition-all duration-150 h-[46px]", // Dotted border
          isFocused || value
            ? "bg-background border-muted-foreground/50" // White background when focused
            : "hover:bg-accent hover:border-muted-foreground/50",
        )}
        onClick={() => {
          const inputElement = document.getElementById(inputId)
          if (inputElement) {
            inputElement.focus()
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
            className="h-7 w-7 flex-shrink-0 cursor-default"
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            id={inputId}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              if (!value) {
                setIsFocused(false)
              }
            }}
            className="border-none bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </form>
  )
} 