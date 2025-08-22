import { TaskData } from "@/lib/types"
import { ChevronRight } from "lucide-react"
// import { ChevronDown } from "lucide-react"
// import { useState } from "react"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

interface BreadcrumbPathProps {
  projectName: string
  taskChain: TaskData[]
  // onNavigate: (path: string[]) => void
}

export function BreadcrumbPath({ projectName, taskChain }: BreadcrumbPathProps) {
  if (taskChain.length <= 1) {
    return null
  }

  const pathItems = taskChain.slice(0, -1) // Exclude the current task
  
  return (
    <div className="flex items-center text-sm text-muted-foreground font-light">
      <span>{projectName}</span>
      
      {pathItems.length > 0 && (
        // Show just the direct parent task
        <span className="flex items-center">
          <ChevronRight className="h-3 w-3 mx-1" />
          {pathItems[pathItems.length - 1].name}
        </span>
      )}
    </div>
  )
} 