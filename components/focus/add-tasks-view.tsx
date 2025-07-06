"use client"
import { useState, useEffect, useRef, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { AddForm } from "@/components/ui/add-form"
import { useAppStore } from "@/store/app-store"
import { useFocusStore } from "@/store/focus-store"
import { ArrowDown, ArrowLeft } from "lucide-react"
import type { TaskData } from "@/lib/types"
import { ProjectsView } from "./projects-view"
import { TasksView } from "./tasks-view"
import { 
  findTaskPath, 
  getProjectId, 
  isProject, 
  isProjectList,
  findProjectAtPath,
  findTaskAtPath
} from "@/lib/task-utils"

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
    if (isVisible && !shouldRender) {
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
      // Start dismissal
      setIsDismissing(true)
      setIsAnimating(false)
    }
  }, [isVisible, shouldRender, isDismissing, globalCurrentPath, currentFocusTask, projects])

  // Handle dismissal animation completion
  useEffect(() => {
    if (isDismissing) {
      const timer = setTimeout(() => {
        setShouldRender(false)
        setIsDismissing(false)
        onClose()
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [isDismissing, onClose])

  const handleClose = useCallback(() => {
    if (!isDismissing) {
      setIsDismissing(true)
      setIsAnimating(false)
    }
  }, [isDismissing])

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
      className={`fixed inset-0 bg-background z-50 transition-all duration-600 ease-out ${
        isAnimating && !isDismissing ? "animate-gentle-spring-up" : isDismissing ? "animate-gentle-spring-down" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isProjectList(currentPath) ? (
          <ProjectsView projects={projects} onNavigateToProject={handleNavigateToProject} />
        ) : (
          <TasksView tasks={currentTasks} onNavigateToTask={handleNavigateToTask} />
        )}
        {!isProjectList(currentPath) && (
          <div className={currentTasks.length > 0 ? "mt-6" : "mt-2"}>
            <AddForm
              placeholder={isProject(currentPath) ? "Add task..." : "Add subtask..."}
              onSubmit={(taskName) => addSubtaskToParent(currentPath, taskName)}
              inputId="add-task-input-inline"
            />
          </div>
        )}
      </div>
    </div>
  )
}

