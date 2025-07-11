"use client"
import { useState, useEffect, useRef, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { AddForm } from "@/components/ui/add-form"
import { useAppStore } from "@/store/app-store"
import { useFocusStore } from "@/store/focus-store"
import { ArrowDown, ArrowLeft, ChevronRight, CheckCircle, Circle } from "lucide-react"
import type { TaskData } from "@/lib/types"

import { 
  findTaskPath, 
  getProjectId, 
  isProject, 
  isProjectList,
  findProjectAtPath,
  findTaskAtPath
} from "@/lib/task-utils"
import { cn } from "@/lib/utils"

interface AddTasksViewProps {
  isVisible: boolean
  onClose: () => void
}

export function AddTasksView({ isVisible, onClose }: AddTasksViewProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const viewRef = useRef<HTMLDivElement>(null)
  const { projects, currentPath: globalCurrentPath, addSubtaskToParent } = useAppStore()
  const { currentFocusTask } = useFocusStore()

  // Handle visibility changes
  useEffect(() => {
    console.log('🔍 AddTasksView visibility effect triggered:', { isVisible, shouldRender, isDismissing, globalCurrentPath, currentFocusTask: currentFocusTask?.name })
    
    if (isVisible && !shouldRender) {
      console.log('📱 Starting to show AddTasksView')
      // Start showing the component
      setShouldRender(true)
      setIsDismissing(false)

      // Initialize with current focus task context
      const globalProjectId = getProjectId(globalCurrentPath)
      if (globalProjectId && currentFocusTask) {
        const project = projects.find((p) => p.id === globalProjectId)
        if (project) {
          const taskPath = findTaskPath(project.tasks, currentFocusTask.id)
          if (taskPath) {
            setCurrentPath([globalProjectId, ...taskPath])
          } else {
            setCurrentPath([globalProjectId])
          }
        }
      } else if (globalProjectId) {
        setCurrentPath([globalProjectId])
      } else {
        setCurrentPath([])
      }

      // Start animation after a brief delay to ensure proper initial state
      setTimeout(() => {
        setIsAnimating(true)
      }, 10)
    } else if (!isVisible && shouldRender && !isDismissing) {
      console.log('❌ DISMISSAL TRIGGERED from visibility effect - isVisible became false')
      // Start dismissal
      setIsDismissing(true)
      setIsAnimating(false)
    }
  }, [isVisible, shouldRender, isDismissing, globalCurrentPath, currentFocusTask])

  // Handle dismissal animation completion
  useEffect(() => {
    if (isDismissing) {
      console.log('⏰ Dismissal animation started, will call onClose in 450ms')
      const timer = setTimeout(() => {
        console.log('📞 Calling onClose callback')
        setShouldRender(false)
        setIsDismissing(false)
        onClose()
      }, 450)
      return () => clearTimeout(timer)
    }
  }, [isDismissing, onClose])

  const handleClose = useCallback(() => {
    console.log('🚪 handleClose called')
    if (!isDismissing) {
      console.log('❌ DISMISSAL TRIGGERED from handleClose')
      setIsDismissing(true)
      setIsAnimating(false)
    }
  }, [isDismissing])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        console.log('⌨️ Escape key pressed in AddTasksView')
        e.preventDefault()
        e.stopPropagation()
        handleClose()
      }
    }

    if (isVisible) {
      window.addEventListener("keydown", handleKeyDown, { capture: true })
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true })
    }
  }, [isVisible, handleClose])

  // Get tasks at the current path
  const getTasksAtPath = (): TaskData[] => {
    if (isProjectList(currentPath)) return []

    const currentProject = findProjectAtPath(projects, currentPath)
    if (!currentProject) return []

    let tasks: TaskData[]
    if (isProject(currentPath)) {
      tasks = currentProject.tasks
    } else {
      const currentTask = findTaskAtPath(projects, currentPath)
      tasks = currentTask?.subtasks || []
    }

    // Only show uncompleted tasks
    return tasks.filter(task => !task.completed)
  }

  // Get current title based on path
  const getCurrentTitle = (): string => {
    if (isProjectList(currentPath)) return "Projects"

    const currentProject = findProjectAtPath(projects, currentPath)
    if (!currentProject) return "Projects"

    if (isProject(currentPath)) {
      return currentProject.name
    }

    const currentTask = findTaskAtPath(projects, currentPath)
    return currentTask?.name || currentProject.name
  }

  const handleNavigateToTask = (taskId: string) => {
    setCurrentPath([...currentPath, taskId])
  }

  const handleNavigateToProject = (projectId: string) => {
    setCurrentPath([projectId])
  }

  const handleNavigateBack = () => {
    if (isProject(currentPath)) {
      setCurrentPath([])
    } else if (currentPath.length > 1) {
      setCurrentPath(currentPath.slice(0, -1))
    }
  }

  const currentTasks = getTasksAtPath()
  const currentTitle = getCurrentTitle()

  // Don't render if not supposed to be visible
  if (!shouldRender) return null

  return (
    <div
      ref={viewRef}
      className={`fixed inset-0 bg-background z-50 flex flex-col ${
        isAnimating && !isDismissing ? "animate-slide-up-from-bottom" : isDismissing ? "animate-slide-down-to-bottom" : "translate-y-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-10">
          {!isProjectList(currentPath) && (
            <Button variant="ghost" size="icon" onClick={handleNavigateBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        <h1 className="text-2xl font-light text-center flex-1">{currentTitle}</h1>
        <div className="w-10 flex justify-end">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content with proper scrolling and rubber band effect */}
      <div 
        className="flex-1 overflow-y-auto overscroll-y-auto"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'auto'
        }}
      >
        <div className="container max-w-4xl mx-auto py-6 px-6">
          <div className="space-y-6">
            {isProjectList(currentPath) ? (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      "flex items-start justify-between p-4 my-2 rounded-2xl border transition-all duration-300 group cursor-pointer",
                      "hover:bg-accent/50 hover:border-primary/30 border-border/50"
                    )}
                    onClick={() => handleNavigateToProject(project.id)}
                  >
                    <div className="flex items-start gap-4 flex-grow min-w-0">
                      <div className="flex items-center min-h-[2rem] pt-0">
                        <div className="h-8 w-8 flex-shrink-0" />
                      </div>
                      <div className="flex items-center min-h-[2rem] flex-grow min-w-0">
                        <span className="text-base font-medium break-words">
                          {project.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2 min-h-[2rem]">
                      <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Tasks List using TaskItem styling */}
                <div className="space-y-1">
                  {currentTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-start justify-between p-4 my-2 rounded-2xl border transition-all duration-300 group cursor-pointer",
                        task.completed
                          ? "bg-muted/20 opacity-60 border-border/30"
                          : "hover:bg-accent/50 hover:border-primary/30 border-border/50"
                      )}
                      onClick={() => handleNavigateToTask(task.id)}
                    >
                      <div className="flex items-start gap-4 flex-grow min-w-0">
                        <div className="flex items-center min-h-[2rem] pt-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 rounded-full pointer-events-none"
                          >
                            {task.completed ? (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center min-h-[2rem] flex-grow min-w-0">
                          <span className={cn("text-base font-medium break-words", task.completed && "line-through text-muted-foreground")}>
                            {task.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2 min-h-[2rem]">
                        <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Task Form */}
                <div className="pt-4">
                  <AddForm
                    placeholder={isProject(currentPath) ? "Add task..." : "Add subtask..."}
                    onSubmit={(taskName) => {
                      console.log('➕ Adding task via AddForm:', taskName, 'to path:', currentPath)
                      addSubtaskToParent(currentPath, taskName)
                      console.log('✅ Task addition complete')
                    }}
                    inputId="add-task-input-inline"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

