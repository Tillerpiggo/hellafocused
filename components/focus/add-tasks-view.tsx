"use client"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { AddForm } from "@/components/ui/add-form"
import { SearchInput } from "@/components/search-input"
import { SearchResults } from "@/components/search-results"
import { EditableTitle, type EditableTitleRef } from "@/components/editable-title"
import { useAppStore } from "@/store/app-store"
import { useFocusStore } from "@/store/focus-store"
import { ArrowDown, ArrowLeft, ArrowRight, Check, CheckCircle, ChevronRight, Circle, Edit, X } from "lucide-react"
import type { TaskData } from "@/lib/types"
import type { TaskPath } from "@/lib/task-path"
import type { SearchResult } from "@/lib/search-utils"
import { searchAllTasks, groupSearchResults } from "@/lib/search-utils"

import {
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

interface AddTasksTaskItemProps {
  task: TaskData
  onNavigate: () => void
  onRename: (name: string) => void
  onToggleComplete: () => void
}

function AddTasksTaskItem({ task, onNavigate, onRename, onToggleComplete }: AddTasksTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const titleRef = useRef<EditableTitleRef>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuPosition) return

    const closeMenu = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuPosition(null)
    }

    document.addEventListener("pointerdown", closeMenu)
    return () => document.removeEventListener("pointerdown", closeMenu)
  }, [menuPosition])

  const startEditing = () => {
    setIsEditing(true)
    setTimeout(() => titleRef.current?.focus(), 0)
  }

  const content = (
    <div
      className={cn(
        "flex items-start justify-between p-4 my-2 rounded-2xl border transition-all duration-300 group cursor-pointer",
        task.completed
          ? "bg-muted/50 opacity-60 border-border/30"
          : "hover:bg-accent/80 hover:border-primary/30 border-border/50 bg-background"
      )}
      onClick={() => {
        if (!isEditing) onNavigate()
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        setMenuPosition({
          x: Math.max(8, Math.min(event.clientX, window.innerWidth - 208)),
          y: Math.max(8, Math.min(event.clientY, window.innerHeight - 88)),
        })
      }}
    >
      <div className="flex items-start gap-4 flex-grow min-w-0">
        <div className="flex items-center min-h-[2rem] pt-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-full hover:bg-primary/10"
            onClick={(event) => {
              event.stopPropagation()
              onToggleComplete()
            }}
          >
            {task.completed ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </Button>
        </div>
        <div className="flex items-center min-h-[2rem] flex-grow min-w-0">
          {isEditing ? (
            <EditableTitle
              ref={titleRef}
              value={task.name}
              onChange={(name) => {
                onRename(name)
                setIsEditing(false)
              }}
              className="text-base font-medium break-words"
              isCompleted={task.completed}
            />
          ) : (
            <span
              className={cn(
                "text-base font-medium break-words",
                task.completed && "line-through text-muted-foreground"
              )}
            >
              {task.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2 min-h-[2rem]">
        <ArrowRight className="h-4 w-4 group-hover:text-primary transition-colors" />
      </div>
    </div>
  )

  return (
    <>
      {content}
      {!isEditing && menuPosition && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[110] w-48 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{ left: menuPosition.x, top: menuPosition.y }}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              setMenuPosition(null)
              onToggleComplete()
            }}
          >
            {task.completed ? (
              <>
                <X className="menu-icon" />
                Mark Incomplete
              </>
            ) : (
              <>
                <Check className="menu-icon" />
                Mark Complete
              </>
            )}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              setMenuPosition(null)
              startEditing()
            }}
          >
            <Edit className="menu-icon" />
            Rename Task
          </button>
        </div>
      )}
    </>
  )
}

export function AddTasksView({ isVisible, onClose }: AddTasksViewProps) {
  const [currentPath, setCurrentPath] = useState<TaskPath>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [completedInSession, setCompletedInSession] = useState<Set<string>>(new Set())
  const viewRef = useRef<HTMLDivElement>(null)
  const headerTitleRef = useRef<EditableTitleRef>(null)
  const projects = useAppStore(s => s.projects)
  const addSubtaskToParent = useAppStore(s => s.addSubtaskToParent)
  const toggleTaskCompletion = useAppStore(s => s.toggleTaskCompletion)
  const updateProjectName = useAppStore(s => s.updateProjectName)
  const updateTaskName = useAppStore(s => s.updateTaskName)
  const currentFocusTaskPath = useFocusStore(s => s.currentFocusTaskPath)
  const focusStartPath = useFocusStore(s => s.focusStartPath)

  // Handle visibility changes
  useEffect(() => {
    if (isVisible && !shouldRender) {
      setShouldRender(true)
      setIsDismissing(false)
      setCompletedInSession(new Set())

      // Focus state already owns the selected task's full path. Falling back to
      // the session scope also handles sessions that do not have a task yet.
      setCurrentPath([...(currentFocusTaskPath ?? focusStartPath)])

      // Start animation after a brief delay to ensure proper initial state
      setTimeout(() => {
        setIsAnimating(true)
      }, 10)
    } else if (!isVisible && shouldRender && !isDismissing) {
      setIsDismissing(true)
      setIsAnimating(false)
    }
  }, [isVisible, shouldRender, isDismissing, currentFocusTaskPath, focusStartPath])
  // Note: projects intentionally excluded to prevent dismissal when tasks are added

  // Handle dismissal animation completion
  useEffect(() => {
    if (isDismissing) {
      const timer = setTimeout(() => {
        setShouldRender(false)
        setIsDismissing(false)
        onClose()
      }, 450)
      return () => clearTimeout(timer)
    }
  }, [isDismissing, onClose])

  // Clear search when navigating to a different path
  useEffect(() => {
    setSearchQuery("")
  }, [currentPath])

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

    return tasks.filter(task => !task.completed || completedInSession.has(task.id))
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

  // Search results (memoized)
  const isSearching = searchQuery.trim().length > 0
  const allSearchResults = useMemo(
    () => isSearching ? searchAllTasks(projects, searchQuery, currentPath) : [],
    [projects, searchQuery, currentPath, isSearching]
  )
  const { currentProject: currentProjectResults, otherProjects: otherProjectResults } = useMemo(
    () => groupSearchResults(allSearchResults),
    [allSearchResults]
  )

  const handleNavigateToSearchResult = (result: SearchResult) => {
    setCurrentPath(result.path)
    setSearchQuery("")
  }

  const currentTasks = getTasksAtPath()
  const currentTitle = getCurrentTitle()

  const handleCurrentTitleChange = (name: string) => {
    if (isProject(currentPath)) {
      updateProjectName(currentPath[0], name)
    } else if (!isProjectList(currentPath)) {
      updateTaskName(currentPath, name)
    }
  }

  const handleToggleTaskCompletion = (taskPath: TaskPath, task: TaskData) => {
    if (!task.completed) {
      setCompletedInSession(prev => new Set(prev).add(task.id))
    } else {
      setCompletedInSession(prev => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
    toggleTaskCompletion(taskPath)
  }

  const handleRenameSearchResult = (result: SearchResult) => {
    setCurrentPath(result.path)
    setSearchQuery("")
    setTimeout(() => headerTitleRef.current?.focus(), 0)
  }

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
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Global search row */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-2">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Jump to any task..."
            className="flex-1"
          />
          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={handleClose}>
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
        {/* Container context — where you're adding */}
        <div className="flex items-center px-6 pb-4 pt-1">
          <div className="w-10">
            {!isProjectList(currentPath) && (
              <Button variant="ghost" size="icon" onClick={handleNavigateBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          {isProjectList(currentPath) ? (
            <h1 className="text-lg font-medium text-center flex-1 text-muted-foreground">{currentTitle}</h1>
          ) : (
            <EditableTitle
              ref={headerTitleRef}
              value={currentTitle}
              onChange={handleCurrentTitleChange}
              className="text-lg font-medium text-center flex-1 text-muted-foreground"
            />
          )}
          <div className="w-10" />
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
            {isSearching ? (
              /* Search results — shown at any level */
              allSearchResults.length > 0 ? (
                <SearchResults
                  results={allSearchResults}
                  currentProjectResults={currentProjectResults}
                  otherProjectResults={otherProjectResults}
                  onNavigateToResult={handleNavigateToSearchResult}
                  currentPath={currentPath}
                  isInProject={isProject(currentPath)}
                  query={searchQuery}
                  onRenameResult={handleRenameSearchResult}
                  onToggleCompleteResult={(result) => handleToggleTaskCompletion(result.path, result.task)}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks found matching &quot;{searchQuery}&quot;</p>
                </div>
              )
            ) : isProjectList(currentPath) ? (
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
                {/* Tasks List */}
                <div className="space-y-1">
                  {currentTasks.map((task) => (
                    <AddTasksTaskItem
                      key={task.id}
                      task={task}
                      onNavigate={() => handleNavigateToTask(task.id)}
                      onRename={(name) => updateTaskName([...currentPath, task.id], name)}
                      onToggleComplete={() => handleToggleTaskCompletion([...currentPath, task.id], task)}
                    />
                  ))}
                </div>

                {/* Add Task Form */}
                <div className="pt-4">
                  <AddForm
                    placeholder={isProject(currentPath) ? "Add task..." : "Add subtask..."}
                    onSubmit={(taskName) => {
                      addSubtaskToParent(currentPath, taskName)
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
