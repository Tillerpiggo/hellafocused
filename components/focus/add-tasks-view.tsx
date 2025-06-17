"use client"
import { useState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { AddForm } from "@/components/ui/add-form"
import { useAppStore } from "@/store/app-store"
import { ArrowDown, ArrowLeft, CheckSquare, Square, ChevronRight } from "lucide-react"
import type { TaskItemData } from "@/lib/types"

interface AddTasksViewProps {
  isVisible: boolean
  onClose: () => void
}



export function AddTasksView({ isVisible, onClose }: AddTasksViewProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const viewRef = useRef<HTMLDivElement>(null)
  const { projects, selectedProjectId, addSubtask, currentFocusTask } = useAppStore()

  // Handle visibility changes
  useEffect(() => {
    if (isVisible && !shouldRender) {
      // Start showing the component
      setShouldRender(true)
      setIsDismissing(false)

      // Initialize with current focus task context
      if (selectedProjectId && currentFocusTask) {
        const project = projects.find((p) => p.id === selectedProjectId)
        if (project) {
          const findPath = (tasks: TaskItemData[], targetId: string, currentPath: string[] = []): string[] | null => {
            for (const task of tasks) {
              const newPath = [...currentPath, task.id]
              if (task.id === targetId) return newPath
              if (task.subtasks.length > 0) {
                const subPath = findPath(task.subtasks, targetId, newPath)
                if (subPath) return subPath
              }
            }
            return null
          }

          const taskPath = findPath(project.tasks, currentFocusTask.id)
          if (taskPath) {
            setCurrentProjectId(selectedProjectId)
            setCurrentPath(taskPath)
          } else {
            setCurrentProjectId(selectedProjectId)
            setCurrentPath([])
          }
        }
      } else if (selectedProjectId) {
        setCurrentProjectId(selectedProjectId)
        setCurrentPath([])
      } else {
        setCurrentProjectId(null)
        setCurrentPath([])
      }

      // Start animation after a brief delay to ensure proper initial state
      setTimeout(() => {
        setIsAnimating(true)
      }, 10)
    } else if (!isVisible && shouldRender && !isDismissing) {
      // Start dismissal
      setIsDismissing(true)
      setIsAnimating(false)
    }
  }, [isVisible, shouldRender, isDismissing, selectedProjectId, currentFocusTask, projects])

  // Handle dismissal animation completion
  useEffect(() => {
    if (isDismissing) {
      const timer = setTimeout(() => {
        setShouldRender(false)
        setIsDismissing(false)
        onClose()
      }, 400) // Reduced from 600ms to 400ms
      return () => clearTimeout(timer)
    }
  }, [isDismissing, onClose])

  // Auto-focus input when animation completes
  useEffect(() => {
    if (isAnimating) {
      // No longer needed
    }
  }, [isAnimating])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
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
  }, [isVisible])

  // Handle touch swipe to dismiss
  useEffect(() => {
    if (!viewRef.current || !isVisible) return

    let startY = 0
    let currentY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      currentY = startY
    }

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY
      const diff = currentY - startY

      if (diff > 0) {
        // Swiping down
        viewRef.current!.style.transform = `translateY(${diff}px)`
      }
    }

    const handleTouchEnd = () => {
      const diff = currentY - startY
      if (diff > 100) {
        // Swipe threshold to dismiss
        handleClose()
      } else {
        // Reset position
        viewRef.current!.style.transform = ""
      }
    }

    const element = viewRef.current
    element.addEventListener("touchstart", handleTouchStart)
    element.addEventListener("touchmove", handleTouchMove)
    element.addEventListener("touchend", handleTouchEnd)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isVisible])

  // Get tasks at the current path
  const getTasksAtPath = (): TaskItemData[] => {
    if (!currentProjectId) return []

    const currentProject = projects.find((p) => p.id === currentProjectId)
    if (!currentProject) return []

    let tasks = currentProject.tasks
    for (const taskId of currentPath) {
      const task = tasks.find((t) => t.id === taskId)
      if (task) {
        tasks = task.subtasks
      } else {
        return []
      }
    }
    return tasks
  }

  // Get current title based on path
  const getCurrentTitle = (): string => {
    if (!currentProjectId) return "Projects"

    const currentProject = projects.find((p) => p.id === currentProjectId)
    if (!currentProject) return "Projects"

    if (currentPath.length === 0) {
      return currentProject.name
    }

    let tasks = currentProject.tasks
    let currentTask = null

    for (const taskId of currentPath) {
      currentTask = tasks.find((t) => t.id === taskId)
      if (currentTask) {
        tasks = currentTask.subtasks
      } else {
        return currentProject.name
      }
    }

    return currentTask?.name || currentProject.name
  }

  const handleNavigateToTask = (taskId: string) => {
    setCurrentPath([...currentPath, taskId])
  }

  const handleNavigateToProject = (projectId: string) => {
    setCurrentProjectId(projectId)
    setCurrentPath([])
  }

  const handleNavigateBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))
    } else if (currentProjectId) {
      setCurrentProjectId(null)
      setCurrentPath([])
    }
  }

  const handleClose = () => {
    if (!isDismissing) {
      setIsDismissing(true)
      setIsAnimating(false)
    }
  }

  const currentTasks = getTasksAtPath()
  const currentTitle = getCurrentTitle()

  // Don't render if not supposed to be visible
  if (!shouldRender) return null

  return (
    <div
      ref={viewRef}
      className={`fixed inset-0 bg-background z-50 transition-all duration-600 ease-out ${
        isAnimating && !isDismissing ? "animate-gentle-spring-up" : isDismissing ? "animate-gentle-spring-down" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="w-10">
          {(currentPath.length > 0 || currentProjectId) && (
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!currentProjectId ? (
          // Projects view
          <div className="space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                className="w-full flex items-center p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                onClick={() => handleNavigateToProject(project.id)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="font-medium">{project.name}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {currentTasks.length > 0 &&
              currentTasks.map((task) => (
                <button
                  key={task.id}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                  onClick={() => handleNavigateToTask(task.id)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {task.completed ? (
                      <CheckSquare className="h-5 w-5 mr-3 text-muted-foreground" />
                    ) : (
                      <Square className="h-5 w-5 mr-3 text-muted-foreground" />
                    )}
                    <span className={task.completed ? "line-through text-muted-foreground" : ""}>{task.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              ))}
          </div>
        )}
        {currentProjectId && (
          <div className={currentTasks.length > 0 ? "mt-6" : "mt-2"}>
            <AddForm
              placeholder={currentPath.length === 0 ? "Add task..." : "Add subtask..."}
              onSubmit={(taskName) => addSubtask(currentProjectId, currentPath, taskName)}
              inputId="add-task-input-inline"
            />
          </div>
        )}
      </div>
    </div>
  )
}
