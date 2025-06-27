"use client"
import { useState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { AddForm } from "@/components/ui/add-form"
import { useAppStore } from "@/store/app-store"
import { ArrowDown, ArrowLeft } from "lucide-react"
import type { TaskItemData } from "@/lib/types"
import { ProjectsView } from "./projects-view"
import { TasksView } from "./tasks-view"
import { findTaskPath } from "@/lib/task-utils"

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
  const { projects, currentPath: globalCurrentPath, addSubtaskToParent, currentFocusTask } = useAppStore()

  // Handle visibility changes
  useEffect(() => {
    if (isVisible && !shouldRender) {
      // Start showing the component
      setShouldRender(true)
      setIsDismissing(false)

      // Initialize with current focus task context
      const currentProjectId = globalCurrentPath[0]
      if (currentProjectId && currentFocusTask) {
        const project = projects.find((p) => p.id === currentProjectId)
        if (project) {
          const taskPath = findTaskPath(project.tasks, currentFocusTask.id)
          if (taskPath) {
            setCurrentProjectId(currentProjectId)
            setCurrentPath(taskPath)
          } else {
            setCurrentProjectId(currentProjectId)
            setCurrentPath([])
          }
        }
      } else if (currentProjectId) {
        setCurrentProjectId(currentProjectId)
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
          <ProjectsView projects={projects} onNavigateToProject={handleNavigateToProject} />
        ) : (
          <TasksView tasks={currentTasks} onNavigateToTask={handleNavigateToTask} />
        )}
        {currentProjectId && (
          <div className={currentTasks.length > 0 ? "mt-6" : "mt-2"}>
            <AddForm
              placeholder={currentPath.length === 0 ? "Add task..." : "Add subtask..."}
              onSubmit={(taskName) => addSubtaskToParent([currentProjectId, ...currentPath], taskName)}
              inputId="add-task-input-inline"
            />
          </div>
        )}
      </div>
    </div>
  )
}
