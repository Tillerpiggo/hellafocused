"use client"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Check, Shuffle, PartyPopper, ArrowUp, X, Plus } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { AddTasksView } from "./add-tasks-view"
import { BreakIntoSubtasksView } from "./break-into-subtasks-view"
import { Textarea } from "@/components/ui/textarea"
import { triggerConfetti } from "@/lib/confetti"

export function FocusView() {
  const currentFocusTask = useAppStore((state) => state.currentFocusTask)
  const completeFocusTask = useAppStore((state) => state.completeFocusTask)
  const getNextFocusTask = useAppStore((state) => state.getNextFocusTask)
  const exitFocusMode = useAppStore((state) => state.exitFocusMode)
  const focusModeProjectLeaves = useAppStore((state) => state.focusModeProjectLeaves)
  const keepGoingFocus = useAppStore((state) => state.keepGoingFocus)
  const selectedProjectId = useAppStore((state) => state.selectedProjectId)
  const updateTaskName = useAppStore((state) => state.updateTaskName)
  const projects = useAppStore((state) => state.projects)
  const showAddTasksView = useAppStore((state) => state.showAddTasksView)
  const showBreakIntoSubtasksView = useAppStore((state) => state.showBreakIntoSubtasksView)
  const setShowAddTasksView = useAppStore((state) => state.setShowAddTasksView)
  const setShowBreakIntoSubtasksView = useAppStore((state) => state.setShowBreakIntoSubtasksView)

  const [isTransitioning, setIsTransitioning] = useState(false)
  const [taskKey, setTaskKey] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [displayedTaskName, setDisplayedTaskName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [isExiting, setIsExiting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update displayed task name when current task changes (but not during completion)
  useEffect(() => {
    if (currentFocusTask && !isCompleting) {
      setDisplayedTaskName(currentFocusTask.name)
      setTaskKey((prev) => prev + 1)
    }
  }, [currentFocusTask, isCompleting])

  // Handle initial load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  // Auto-resize textarea and position cursor when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // Use a small timeout to ensure the textarea is fully rendered
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto"
          textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
          textareaRef.current.focus()

          // Position cursor at the end of the text
          const length = textareaRef.current.value.length
          textareaRef.current.setSelectionRange(length, length)
        }
      }, 10)
    }
  }, [isEditing])

  // Update textarea height when content changes
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [editValue])

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          handleSaveEdit()
        } else if (e.key === "Escape") {
          handleCancelEdit()
        }
      } else if (e.key === "Escape") {
        handleExitFocusMode()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isEditing, editValue])

  // Find the task path for the current focus task
  const findTaskPath = (tasks: any[], targetId: string, currentPath: string[] = []): string[] | null => {
    for (const task of tasks) {
      const newPath = [...currentPath, task.id]
      if (task.id === targetId) return newPath
      if (task.subtasks && task.subtasks.length > 0) {
        const subPath = findTaskPath(task.subtasks, targetId, newPath)
        if (subPath) return subPath
      }
    }
    return null
  }

  const handleEditTask = () => {
    if (currentFocusTask) {
      setEditValue(currentFocusTask.name)
      setIsEditing(true)
    }
  }

  const handleSaveEdit = () => {
    if (currentFocusTask && selectedProjectId && editValue.trim() !== "") {
      const project = projects.find((p) => p.id === selectedProjectId)
      if (project) {
        const taskPath = findTaskPath(project.tasks, currentFocusTask.id)
        if (taskPath) {
          updateTaskName(selectedProjectId, taskPath, editValue.trim())
          setDisplayedTaskName(editValue.trim())
        }
      }
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditValue("")
    setIsEditing(false)
  }

  const handleCompleteTask = () => {
    if (isCompleting || !currentFocusTask || isEditing) return

    setIsCompleting(true)

    // Trigger confetti
    triggerConfetti()

    // Start transition animation
    setIsTransitioning(true)

    // Complete task in backend but delay getting next task
    completeFocusTask()

    // After animation, get next task and update display
    setTimeout(() => {
      getNextFocusTask()
      setIsTransitioning(false)
      setIsCompleting(false)
    }, 200)
  }

  const handleGetNextTask = () => {
    if (isCompleting || isEditing) return

    setIsTransitioning(true)

    setTimeout(() => {
      getNextFocusTask()
      setIsTransitioning(false)
    }, 100)
  }

  const handleExitFocusMode = () => {
    setIsExiting(true)
    setTimeout(() => {
      exitFocusMode()
    }, 500) // Increased from 300ms to 500ms for gentler exit
  }

  if (!currentFocusTask) {
    const allTasksInProjectCompleted = focusModeProjectLeaves.every((t) => t.completed)
    if (allTasksInProjectCompleted && focusModeProjectLeaves.length > 0) {
      return (
        <>
          <div
            className={`min-h-screen flex flex-col transition-all duration-500 ease-out ${
              isInitialLoad ? "opacity-0 scale-95" : isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
            style={{ zIndex: isExiting ? 40 : 50 }}
          >
            {/* Exit button in top left */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 left-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
              onClick={handleExitFocusMode}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Exit focus mode</span>
            </Button>

            {/* Add tasks button in top right */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 right-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
              onClick={() => setShowAddTasksView(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">Add tasks</span>
            </Button>

            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mb-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <PartyPopper className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-light mb-4 text-foreground">Beautiful work</h2>
              <p className="text-muted-foreground text-lg sm:text-xl mb-12 max-w-md leading-relaxed">
                All tasks in this section are complete. Take a moment to appreciate your progress.
              </p>
              <Button
                size="lg"
                className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
                onClick={keepGoingFocus}
              >
                <ArrowUp className="mr-2 h-5 w-5" />
                Continue Journey
              </Button>
            </div>
          </div>
          <AddTasksView isVisible={showAddTasksView} onClose={() => setShowAddTasksView(false)} />
          <BreakIntoSubtasksView
            isVisible={showBreakIntoSubtasksView}
            onClose={() => setShowBreakIntoSubtasksView(false)}
          />
        </>
      )
    }
    return (
      <>
        <div
          className={`min-h-screen flex flex-col transition-all duration-500 ease-out ${
            isInitialLoad ? "opacity-0 scale-95" : isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
          style={{ zIndex: isExiting ? 40 : 50 }}
        >
          {/* Exit button in top left */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 left-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
            onClick={handleExitFocusMode}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Exit focus mode</span>
          </Button>

          {/* Add tasks button in top right */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
            onClick={() => setShowAddTasksView(true)}
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Add tasks</span>
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 mb-8 rounded-full bg-muted/50 flex items-center justify-center">
              <div className="w-3 h-3 bg-muted-foreground/30 rounded-full"></div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light mb-4 text-muted-foreground">Peaceful moment</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed">
              No tasks await your attention right now. Rest in this quiet space.
            </p>
          </div>
        </div>
        <AddTasksView isVisible={showAddTasksView} onClose={() => setShowAddTasksView(false)} />
        <BreakIntoSubtasksView
          isVisible={showBreakIntoSubtasksView}
          onClose={() => setShowBreakIntoSubtasksView(false)}
        />
      </>
    )
  }

  return (
    <>
      <div
        className={`min-h-screen flex flex-col relative transition-all duration-500 ease-out ${
          isInitialLoad ? "opacity-0 scale-95" : isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{ zIndex: isExiting ? 40 : 50 }}
      >
        {/* Exit button in top left */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 left-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
          onClick={handleExitFocusMode}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Exit focus mode</span>
        </Button>

        {/* Add tasks button in top right */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6 h-10 w-10 rounded-full opacity-50 hover:opacity-100 transition-opacity z-10"
          onClick={() => setShowAddTasksView(true)}
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">Add tasks</span>
        </Button>

        {/* Main content area with task title - centered vertically and horizontally */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div className="relative max-w-4xl w-full">
            {isEditing ? (
              <div className="flex items-center justify-center">
                <Textarea
                  ref={textareaRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-foreground text-center leading-relaxed break-words border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none overflow-hidden w-full m-0"
                  style={{
                    minHeight: "auto",
                    lineHeight: "1.2",
                    margin: 0,
                    padding: 0,
                    verticalAlign: "middle",
                    display: "block",
                  }}
                />
              </div>
            ) : (
              <h1
                key={taskKey}
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-foreground text-center leading-relaxed break-words transition-all duration-300 ease-out ${
                  isTransitioning ? "animate-slide-up-out" : "animate-slide-up-in"
                }`}
              >
                {displayedTaskName || currentFocusTask.name}
              </h1>
            )}
          </div>
        </div>

        {/* Bottom action buttons */}
        <div className="flex flex-col sm:flex-row gap-6 p-8 max-w-md mx-auto w-full">
          <Button
            size="lg"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
            onClick={handleCompleteTask}
            disabled={isCompleting || isEditing}
          >
            <Check className="mr-2 h-5 w-5" />
            Complete
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 py-4 rounded-full transition-all duration-300 hover:scale-105 border-2"
            onClick={handleGetNextTask}
            disabled={isCompleting || isEditing}
          >
            <Shuffle className="mr-2 h-5 w-5" />
            Next
          </Button>
        </div>
      </div>

      {/* Add Tasks View */}
      <AddTasksView isVisible={showAddTasksView} onClose={() => setShowAddTasksView(false)} />

      {/* Break Into Subtasks View */}
      <BreakIntoSubtasksView
        isVisible={showBreakIntoSubtasksView}
        onClose={() => setShowBreakIntoSubtasksView(false)}
      />
    </>
  )
}
