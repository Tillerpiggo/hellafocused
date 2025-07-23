"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronRight, Folder, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import type { TaskData } from "@/lib/types"
import { 
  getValidDropTargets, 
  getPathDisplayName, 
  isProject, 
  isProjectList,
  findTaskAtPath,
  findProjectAtPath,
  arePathsEqual,
  isTaskDescendantOf 
} from "@/lib/task-utils"

interface MoveTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  taskPath: string[]
  taskName: string
}

export function MoveTaskDialog({ isOpen, onClose, taskPath, taskName }: MoveTaskDialogProps) {
  const { projects, moveTaskToNewParent } = useAppStore()
  
  // Start navigation at the parent of the task being moved
  const initialNavigationPath = taskPath.slice(0, -1)
  const [currentNavigationPath, setCurrentNavigationPath] = useState<string[]>(initialNavigationPath)
  const [isMoving, setIsMoving] = useState(false)

  const validTargets = getValidDropTargets(projects, taskPath)

  const isValidTarget = (targetPath: string[]): boolean => {
    return validTargets.some(validPath => arePathsEqual(validPath, targetPath))
  }

  // Get items to display at current navigation level
  const getNavigationItems = () => {
    if (isProjectList(currentNavigationPath)) {
      return projects.map(project => ({
        id: project.id,
        name: project.name,
        type: 'project' as const,
        path: [project.id],
        isValid: isValidTarget([project.id]),
        hasChildren: project.tasks.length > 0
      }))
    }

    // Get tasks at current path
    const project = findProjectAtPath(projects, currentNavigationPath)
    if (!project) return []

    let tasks: TaskData[]
    if (isProject(currentNavigationPath)) {
      tasks = project.tasks
    } else {
      const currentTask = findTaskAtPath(projects, currentNavigationPath)
      tasks = currentTask?.subtasks || []
    }

    return tasks
      .filter(task => !task.completed) // Only show incomplete tasks
      .map(task => ({
        id: task.id,
        name: task.name,
        type: 'task' as const,
        path: [...currentNavigationPath, task.id],
        isValid: isValidTarget([...currentNavigationPath, task.id]),
        hasChildren: task.subtasks.length > 0
      }))
  }

  const handleNavigateInto = (path: string[]) => {
    setCurrentNavigationPath(path)
  }

  const handleNavigateBack = () => {
    if (isProject(currentNavigationPath)) {
      setCurrentNavigationPath([])
    } else if (currentNavigationPath.length > 1) {
      setCurrentNavigationPath(currentNavigationPath.slice(0, -1))
    }
  }

  const handleMoveHere = async () => {
    if (!isValidTarget(currentNavigationPath) || isMoving) return

    setIsMoving(true)
    try {
      moveTaskToNewParent(taskPath, currentNavigationPath)
      onClose()
    } catch (error) {
      console.error('Failed to move task:', error)
    } finally {
      setIsMoving(false)
    }
  }

  const getCurrentTitle = () => {
    if (isProjectList(currentNavigationPath)) return "Projects"
    return getPathDisplayName(projects, currentNavigationPath)
  }

  const getBackButtonText = () => {
    if (isProject(currentNavigationPath)) {
      return "Back to Projects"
    } else if (currentNavigationPath.length > 1) {
      const parentPath = currentNavigationPath.slice(0, -1)
      const parentName = getPathDisplayName(projects, parentPath)
      return `Back to ${parentName}`
    }
    return "Back"
  }

  const getMoveToText = () => {
    if (isProjectList(currentNavigationPath)) {
      return "Move to \"Projects\""
    }
    return `Move to "${getCurrentTitle()}"`
  }

  const navigationItems = getNavigationItems()
  const canMoveHere = isValidTarget(currentNavigationPath)
  const isCurrentLocation = arePathsEqual(taskPath.slice(0, -1), currentNavigationPath)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center truncate px-4">Move &quot;{taskName}&quot;</DialogTitle>
        </DialogHeader>

        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {!isProjectList(currentNavigationPath) && (
              <Button variant="ghost" size="sm" onClick={handleNavigateBack} className="truncate max-w-[calc(100%-1rem)]">
                <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">
                  {getBackButtonText()}
                </span>
              </Button>
            )}
            {isProjectList(currentNavigationPath) && (
              <h3 className="font-medium truncate">{getCurrentTitle()}</h3>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isOriginalTask = arePathsEqual(taskPath, item.path)
              const isDescendant = isTaskDescendantOf(item.path, taskPath)
              const isDisabled = isOriginalTask || isDescendant || !item.isValid

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                    isDisabled 
                      ? "opacity-50 cursor-not-allowed bg-muted/30" 
                      : "hover:bg-accent border-border"
                  )}
                  onClick={() => !isDisabled && handleNavigateInto(item.path)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {item.type === 'project' ? (
                        <Folder className="h-4 w-4 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <span className={cn(
                      "font-medium truncate",
                      isOriginalTask && "text-muted-foreground"
                    )}>
                      {item.name}
                      {isOriginalTask && " (current location)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.hasChildren && !isDisabled && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )
            })}

            {navigationItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No available locations
              </div>
            )}
          </div>
        </div>

        {/* Footer with Move Button */}
        <div className="pt-4 border-t">
          <Button 
            className="w-full truncate" 
            onClick={handleMoveHere}
            disabled={isMoving || !canMoveHere || isCurrentLocation}
            variant={(!canMoveHere || isCurrentLocation) ? "secondary" : "default"}
          >
            <span className="truncate">
              {isMoving ? "Moving..." : getMoveToText()}
            </span>
          </Button>
          {isCurrentLocation && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              This is the task&apos;s current location
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 