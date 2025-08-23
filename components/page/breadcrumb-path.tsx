import { TaskData } from "@/lib/types"
import { ChevronRight } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppStore } from "@/store/app-store"
import { getProjectId } from "@/lib/task-utils"

interface BreadcrumbPathProps {
  projectName: string
  taskChain: TaskData[]
}

export function BreadcrumbPath({ projectName, taskChain }: BreadcrumbPathProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { navigateToPath, currentPath } = useAppStore()

  const projectId = getProjectId(currentPath)
  
  // Create array of all names in the chain excluding current task
  const allNames = [projectName, ...taskChain.slice(0, -1).map(task => task.name)]
  
  // Get the second to last two items (might only be one item)
  const breadcrumbNames = allNames.length > 2 ? allNames.slice(-2) : allNames
  
  if (breadcrumbNames.length === 0) {
    return null
  }
  
  const handleNavigateToProject = () => {
    if (projectId) {
      navigateToPath([projectId])
      setIsOpen(false)
    }
  }

  const handleNavigateToTask = (taskIndex: number) => {
    if (projectId) {
      // Build path: project + task IDs up to the selected task
      const taskPath = [projectId, ...taskChain.slice(0, taskIndex + 1).map(task => task.id)]
      navigateToPath(taskPath)
      setIsOpen(false)
    }
  }
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center text-sm text-muted-foreground font-light cursor-pointer hover:text-foreground transition-colors">
          {breadcrumbNames.map((name, index) => (
            <span key={`${name}-${index}`} className="flex items-center">
              {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
              <span>{name}</span>
            </span>
          ))}
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64 md:w-80">
        {/* Project level */}
        <DropdownMenuItem 
          onClick={handleNavigateToProject}
          className="font-medium"
        >
          <span className="truncate">{projectName}</span>
        </DropdownMenuItem>
        
        {/* All tasks in the chain */}
        {taskChain.map((task, index) => {
          const isCurrentTask = index === taskChain.length - 1
          const indentLevel = index + 1
          
          return (
            <DropdownMenuItem
              key={task.id}
              onClick={() => handleNavigateToTask(index)}
              className={`${
                isCurrentTask 
                  ? "bg-accent text-accent-foreground font-medium" 
                  : ""
              }`}
              style={{ paddingLeft: `${indentLevel * 12 + 8}px` }}
            >
              <span className="truncate block">{task.name}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 