"use client"
import { ProjectListItem } from "@/components/project/project-list-item"
import { AddProjectForm } from "@/components/project/add-project-form"
import { TaskListView } from "@/components/task/task-list-view"
import { FocusView } from "@/components/focus/focus-view"
import { TaskCompletionDialog } from "@/components/task/task-completion-dialog"
import { DeleteConfirmationDialog } from "@/components/task/delete-confirmation-dialog"
import { useAppStore, getCurrentTasksForView, getCurrentTaskChain } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, X, Target } from "lucide-react"
import { AddTaskForm } from "@/components/task/add-task-form"
import { EditableTitle, type EditableTitleRef } from "@/components/editable-title"
import { TaskOptionsMenu } from "@/components/task/task-options-menu"
import { triggerConfetti } from "@/lib/confetti"
import { useRef } from "react"
import { countSubtasksRecursively, findTaskByPath, findProjectByPath, getProjectId, isProject, isProjectList } from "@/lib/task-utils"

export default function HomePage() {
  const store = useAppStore()
  const {
    projects,
    currentPath,
    isFocusMode,
    navigateBack,
    selectProject,
    updateProjectName,
    updateTaskName,
    showTaskCompletionDialog,
    pendingTaskCompletion,
    confirmTaskCompletion,
    cancelTaskCompletion,
    toggleTaskCompletion,
    addProject,
    deleteTask,
    deleteProject,
    showCompleted,
    showDeleteConfirmationDialog,
    pendingDeletion,
    confirmDeletion,
    cancelDeletion,
    enterFocusMode,
    exitFocusMode,
  } = store

  const titleRef = useRef<EditableTitleRef>(null)

  const tasksToDisplay = getCurrentTasksForView(store)
  const currentProject = findProjectByPath(projects, currentPath)
  const taskChain = getCurrentTaskChain(store)
  const currentTask = taskChain.length > 0 ? taskChain[taskChain.length - 1] : null
  const isCurrentTaskCompleted = currentTask?.completed || false

  // Get pending task info for dialog
  const pendingTask = pendingTaskCompletion
    ? findTaskByPath(projects, pendingTaskCompletion)
    : null

  const pendingTaskSubtaskCount = pendingTask ? pendingTask.subtasks.filter((st: any) => !st.completed).length : 0

  // Get pending deletion info
  const pendingDeletionItem = pendingDeletion
    ? (() => {
        if (isProject(pendingDeletion)) {
          // Deleting a project
          const project = findProjectByPath(projects, pendingDeletion)
          if (!project) return null
          
          return {
            name: project.name,
            type: "project" as const,
            subtaskCount: project.tasks.reduce((acc, task) => acc + 1 + countSubtasksRecursively(task), 0),
          }
        } else {
          // Deleting a task
          const task = findTaskByPath(projects, pendingDeletion)
          if (!task) return null

          return {
            name: task.name,
            type: "task" as const,
            subtaskCount: countSubtasksRecursively(task),
          }
        }
      })()
    : null

  if (isFocusMode) {
    // Determine focus parameters
    const focusProjectId = getProjectId(currentPath) || undefined
    const focusStartPath = currentPath

    return (
      <div className="bg-background text-foreground">
        <FocusView startPath={focusStartPath} />
      </div>
    )
  }

  const getBackButtonText = () => {
    if (isProjectList(currentPath)) return ""

    if (isProject(currentPath)) {
      return "Projects"
    } else if (currentPath.length === 2) {
      return currentProject?.name || "Project"
    } else {
      // Get the parent task name
      const parentTask = taskChain[taskChain.length - 2]
      return parentTask?.name || "Back"
    }
  }

  const handleBackClick = () => {
    if (isProject(currentPath)) {
      selectProject(null)
    } else {
      navigateBack()
    }
  }

  const handleTitleChange = (newTitle: string) => {
    if (isProjectList(currentPath)) return

    if (isProject(currentPath)) {
      // Editing project name
      const projectId = getProjectId(currentPath)
      if (projectId) {
        updateProjectName(projectId, newTitle)
      }
    } else {
      // Editing task name
      updateTaskName(currentPath, newTitle)
    }
  }

  const handleDelete = () => {
    if (isProjectList(currentPath)) return

    if (isProject(currentPath)) {
      // Delete project
      const projectId = getProjectId(currentPath)
      if (projectId) {
        deleteProject(projectId)
      }
    } else {
      // Delete task
      deleteTask(currentPath)
    }
  }

  const handleFocusClick = () => {
    if (isFocusMode) {
      exitFocusMode()
    } else {
      enterFocusMode() // Store handles logic if project not selected
    }
  }

  // Check if current task/project should show complete button
  const shouldShowCompleteButton = () => {
    if (isProjectList(currentPath) || isProject(currentPath)) return false

    // At task level - show if current task is not completed AND has no incomplete subtasks
    if (isCurrentTaskCompleted) return false
    const hasIncompleteSubtasks = currentTask?.subtasks.some((subtask) => !subtask.completed) || false
    return !hasIncompleteSubtasks
  }

  const handleCompleteCurrentItem = () => {
    triggerConfetti()
    toggleTaskCompletion(currentPath)
  }

  const handleUncompleteCurrentItem = () => {
    toggleTaskCompletion(currentPath)
  }

  const handleAddProject = (projectName: string) => {
    addProject(projectName)
  }

  const handleRename = () => {
    // Focus the editable title
    setTimeout(() => titleRef.current?.focus(), 0)
  }

  const pageContent = () => {
    if (isProjectList(currentPath)) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-light tracking-wide text-foreground">Projects</h1>
            <Button
              variant={isFocusMode ? "secondary" : "outline"}
              size="sm"
              className="transition-all duration-200 hover:scale-105"
              onClick={handleFocusClick}
            >
              <Target className="h-4 w-4 mr-2" />
              {isFocusMode ? "Exit" : "Focus"}
            </Button>
          </div>
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}
          </div>

          <AddProjectForm onAddProject={handleAddProject} />
        </div>
      )
    }

    const currentProjectId = getProjectId(currentPath)
    if (!currentProjectId) return null

    return (
      <div className="space-y-6 pb-32">
        {/* Navigation and Focus button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="text-muted-foreground hover:text-foreground px-0 py-3 h-auto font-normal -ml-2 pl-2 pr-4 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {getBackButtonText()}
          </Button>
          <Button
            variant={isFocusMode ? "secondary" : "outline"}
            size="sm"
            className="transition-all duration-200 hover:scale-105"
            onClick={handleFocusClick}
          >
            <Target className="h-4 w-4 mr-2" />
            Focus
          </Button>
        </div>

        {/* Title and Action Buttons */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-light tracking-wide text-foreground flex-1">
            <EditableTitle
              ref={titleRef}
              value={
                isProject(currentPath) ? currentProject?.name || "" : taskChain[taskChain.length - 1]?.name || ""
              }
              onChange={handleTitleChange}
              className="text-3xl font-light tracking-wide text-foreground"
              isCompleted={isCurrentTaskCompleted}
            />
          </h1>
          <div className="flex items-center gap-3 flex-shrink-0">
            <TaskOptionsMenu
              onRename={handleRename}
              onDelete={handleDelete}
              showCompleted={showCompleted}
              isProject={isProject(currentPath)}
            />
            {shouldShowCompleteButton() && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCompleteCurrentItem}
                className="text-primary border-primary/50 hover:bg-primary/10 hover:text-primary hover:border-primary rounded-full px-4"
              >
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
            {isCurrentTaskCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUncompleteCurrentItem}
                className="text-muted-foreground border-muted-foreground/30 hover:bg-muted/30 hover:text-foreground hover:border-muted-foreground rounded-full px-4"
              >
                <X className="h-4 w-4 mr-1" />
                Uncomplete
              </Button>
            )}
          </div>
        </div>

        {/* Breadcrumb path (if deeper than one level) */}
        {taskChain.length > 1 && (
          <div className="text-sm text-muted-foreground font-light">
            <span>{currentProject?.name}</span>
            {taskChain.slice(0, -1).map((task) => (
              <span key={task.id}>
                {" / "}
                {task.name}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <TaskListView tasks={tasksToDisplay} currentPath={currentPath} />
        </div>

        {/* Show AddTaskForm for all levels */}
        {!isProjectList(currentPath) && <AddTaskForm currentPath={currentPath} />}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 container max-w-4xl mx-auto py-12 px-6">{pageContent()}</main>
      <TaskCompletionDialog
        isOpen={showTaskCompletionDialog}
        onClose={cancelTaskCompletion}
        onConfirm={confirmTaskCompletion}
        taskName={pendingTask?.name || ""}
        subtaskCount={pendingTaskSubtaskCount}
      />
      {pendingDeletionItem && (
        <DeleteConfirmationDialog
          isOpen={showDeleteConfirmationDialog}
          onClose={cancelDeletion}
          onConfirm={confirmDeletion}
          itemName={pendingDeletionItem.name}
          itemType={pendingDeletionItem.type}
          subtaskCount={pendingDeletionItem.subtaskCount}
        />
      )}
    </div>
  )
}
