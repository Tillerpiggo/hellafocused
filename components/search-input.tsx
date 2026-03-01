"use client"

import { useState, useEffect, forwardRef } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({ 
  value, 
  onChange, 
  placeholder = "Search tasks and subtasks...",
  className 
}, ref) => {
  const [localValue, setLocalValue] = useState(value)

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounced update to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [localValue, onChange])

  const handleClear = () => {
    setLocalValue("")
    onChange("")
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={ref}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1.5 h-7 w-7 hover:bg-muted/80"
          onClick={handleClear}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
})

SearchInput.displayName = "SearchInput" 
