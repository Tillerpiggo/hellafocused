"use client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Star, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type React from "react"

interface PriorityDropdownProps {
  children: React.ReactNode
  currentPriority: number
  onPriorityChange: (priority: number) => void
}

export function PriorityDropdown({ children, currentPriority, onPriorityChange }: PriorityDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem 
          onClick={() => onPriorityChange(1)}
          className={cn(
            "gap-2 cursor-pointer",
            currentPriority === 1 && "bg-accent"
          )}
        >
          <Star className="h-4 w-4 text-amber-600 fill-amber-600 dark:text-amber-400 dark:fill-amber-400" />
          Prefer
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onPriorityChange(0)}
          className={cn(
            "gap-2 cursor-pointer",
            currentPriority === 0 && "bg-accent"
          )}
        >
          <Circle className="h-4 w-4 text-muted-foreground" />
          Normal
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onPriorityChange(-1)}
          className={cn(
            "gap-2 cursor-pointer",
            currentPriority === -1 && "bg-accent"
          )}
        >
          <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          Defer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}