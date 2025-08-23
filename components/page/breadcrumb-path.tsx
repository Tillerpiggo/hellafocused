import { TaskData } from "@/lib/types"
import { ChevronDown, Home, Folder } from "lucide-react"
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
  const { navigateToPath, currentPath, navigationContext, projects } = useAppStore()

  const projectId = getProjectId(currentPath)
  
  // Build the full context chain for the dropdown
  const contextTaskChain: TaskData[] = []
  if (navigationContext.length > 1 && navigationContext[0] === projectId) {
    // Build chain from navigation context
    const project = projects.find(p => p.id === projectId)
    if (project) {
      let currentTasks = project.tasks
      const taskPath = navigationContext.slice(1) // Remove project ID
      for (const taskId of taskPath) {
        const task = currentTasks.find((t) => t.id === taskId)
        if (task) {
          contextTaskChain.push(task)
          currentTasks = task.subtasks
        } else {
          break // Path broken
        }
      }
    }
  }
  
  // Use the full context chain if available, otherwise fall back to current chain
  const dropdownTaskChain = contextTaskChain.length > 0 ? contextTaskChain : taskChain
  
  // Create array of all names in the chain excluding current task (for preview text)
  const allNames = [projectName, ...taskChain.slice(0, -1).map(task => task.name)]
  
  // Get the second to last two items (might only be one item) for preview text
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
      const taskPath = [projectId, ...dropdownTaskChain.slice(0, taskIndex + 1).map(task => task.id)]
      navigateToPath(taskPath)
      setIsOpen(false)
    }
  }
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 border border-primary/20 hover:border-primary/30 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 shadow-sm hover:shadow-md backdrop-blur-md">
          <div className="flex items-center">
            {breadcrumbNames.map((name, index) => {
              const isProject = index === 0 && name === projectName
              const opacity = breadcrumbNames.length > 1 
                ? (index === 0 ? 'opacity-70' : 'opacity-100')
                : 'opacity-100'
              
              return (
                <span key={`${name}-${index}`} className="flex items-center">
                  {index > 0 && (
                    <span className="mx-1.5 text-muted-foreground/40 select-none">/</span>
                  )}
                  <span className={`flex items-center gap-1.5 text-muted-foreground ${opacity}`}>
                    {isProject && <Home className="h-3 w-3" />}
                    <span className={`truncate ${isProject ? 'font-medium' : 'font-normal'}`}>
                      {name}
                    </span>
                  </span>
                </span>
              )
            })}
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64 md:w-80 bg-background/95 backdrop-blur-sm border-border/50 shadow-lg animate-in slide-in-from-top-2 duration-200">
        {/* Project level */}
        <DropdownMenuItem 
          onClick={handleNavigateToProject}
          className="font-medium hover:bg-accent/80 transition-colors duration-150"
        >
          <div className="flex items-center gap-2">
            <Home className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{projectName}</span>
          </div>
        </DropdownMenuItem>
        
        {dropdownTaskChain.length > 0 && <div className="h-px bg-border/50 my-1"></div>}
        
        {/* All tasks in the chain */}
        {dropdownTaskChain.map((task, index) => {
          // Check if this task is the current task based on the currentPath
          const isCurrentTask = currentPath.length > 1 && currentPath[currentPath.length - 1] === task.id
          const indentLevel = index + 1
          
          return (
            <DropdownMenuItem
              key={task.id}
              onClick={() => handleNavigateToTask(index)}
              className={`relative hover:bg-accent/80 transition-colors duration-150 ${
                isCurrentTask 
                  ? "font-medium" 
                  : "font-normal"
              }`}
              style={{ paddingLeft: `${indentLevel * 16 + 8}px` }}
            >
              {isCurrentTask && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
              )}
              <div className="flex items-center gap-2 w-full">
                <Folder className={`h-3 w-3 flex-shrink-0 ${
                  isCurrentTask ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <span className={`truncate block flex-1 ${
                  isCurrentTask ? 'text-foreground' : 'text-muted-foreground'
                }`}>{task.name}</span>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 