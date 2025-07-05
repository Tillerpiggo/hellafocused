"use client"
import { ProjectListItem } from "@/components/project/project-list-item"
import { AddProjectForm } from "@/components/project/add-project-form"
import { TaskListView } from "@/components/task/task-list-view"
import { FocusView } from "@/components/focus/focus-view"
import { TaskCompletionDialog } from "@/components/task/task-completion-dialog"
import { DeleteConfirmationDialog } from "@/components/task/delete-confirmation-dialog"
import { PageHeader } from "@/components/page/page-header"
import { PageNavigation } from "@/components/page/page-navigation"
import { BreadcrumbPath } from "@/components/page/breadcrumb-path"
import { TopBar } from "@/components/top-bar"
import { useAppStore, getCurrentTasksForView, getCurrentTaskChain } from "@/store/app-store"
import { useSyncStore } from "@/store/sync-store"
import { useUIStore } from "@/store/ui-store"
import { Button } from "@/components/ui/button"
import { Target, Loader2 } from "lucide-react"
import { AddTaskForm } from "@/components/task/add-task-form"
import { type EditableTitleRef } from "@/components/editable-title"
import { useRef } from "react"
import { countSubtasksRecursively, findTaskAtPath, findProjectAtPath, getProjectId, isProject, isProjectList } from "@/lib/task-utils"

export default function AppPage() {
  const store = useAppStore()
  const {
    projects,
    currentPath,
    navigateBack,
    selectProject,
    updateProjectName,
    updateTaskName,
    toggleTaskCompletion, // Still needed for uncompleting tasks (no confirmation needed)
    addProject,
    showCompleted,
  } = store

  const { syncLoading, lastSyncedAt } = useSyncStore()

  const uiStore = useUIStore()
  const {
    showTaskCompletionDialog,
    pendingTaskCompletion,
    showDeleteConfirmationDialog,
    pendingDeletion,
    attemptTaskCompletion,
    confirmTaskCompletion,
    cancelTaskCompletion,
    attemptDeletion,
    confirmDeletion,
    cancelDeletion,
    isFocusMode,
    setFocusMode,
  } = uiStore

  const titleRef = useRef<EditableTitleRef>(null)

  // Show loading until sync has been initialized at least once
  const shouldShowLoading = syncLoading || lastSyncedAt === 0

  const tasksToDisplay = getCurrentTasksForView(store)
  const currentProject = findProjectAtPath(projects, currentPath)
  const taskChain = getCurrentTaskChain(store)
  const currentTask = taskChain.length > 0 ? taskChain[taskChain.length - 1] : null
  const isCurrentTaskCompleted = currentTask?.completed || false

  // Get pending task info for dialog
  const pendingTask = pendingTaskCompletion
    ? findTaskAtPath(projects, pendingTaskCompletion)
    : null

  const pendingTaskSubtaskCount = pendingTask ? pendingTask.subtasks.filter((st) => !st.completed).length : 0

  // Get pending deletion info
  const pendingDeletionItem = pendingDeletion
    ? (() => {
        if (isProject(pendingDeletion)) {
          // Deleting a project
          const project = findProjectAtPath(projects, pendingDeletion)
          if (!project) return null
          
          return {
            name: project.name,
            type: "project" as const,
            subtaskCount: project.tasks.reduce((acc, task) => acc + 1 + countSubtasksRecursively(task), 0),
          }
        } else {
          // Deleting a task
          const task = findTaskAtPath(projects, pendingDeletion)
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
    return (
      <div className="bg-background text-foreground">
        <FocusView startPath={currentPath} />
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
      const projectId = getProjectId(currentPath)
      if (projectId) {
        attemptDeletion([projectId])
      }
    } else {
      attemptDeletion(currentPath)
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
              onClick={() => setFocusMode(!isFocusMode)}
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

          <AddProjectForm onAddProject={addProject} />
        </div>
      )
    }

    const currentProjectId = getProjectId(currentPath)
    if (!currentProjectId) return null

    return (
      <div className="space-y-6 pb-32">
        {/* Navigation and Focus button */}
        <PageNavigation
          backText={getBackButtonText()}
          onBackClick={handleBackClick}
          showFocusButton={true}
          isFocusMode={isFocusMode}
          onFocusClick={() => setFocusMode(!isFocusMode)}
        />

        {/* Page Header with title and breadcrumb */}
        <PageHeader
          title={isProject(currentPath) ? currentProject?.name || "Project" : currentTask?.name || "Task"}
          titleRef={titleRef}
          onTitleChange={handleTitleChange}
          onDelete={handleDelete}
          showCompleted={showCompleted}
          breadcrumbPath={
            <BreadcrumbPath
              currentPath={currentPath}
              projects={projects}
              onNavigate={(path) => {
                if (isProjectList(path)) {
                  selectProject(null)
                } else {
                  store.setCurrentPath(path)
                }
              }}
            />
          }
          completeButtonProps={
            shouldShowCompleteButton()
              ? {
                  onComplete: () => attemptTaskCompletion(currentPath),
                  isCompleted: isCurrentTaskCompleted,
                }
              : undefined
          }
        />

        {/* Tasks */}
        <TaskListView tasks={tasksToDisplay} parentPath={currentPath} />

        {/* Add Task Form */}
        <AddTaskForm
          onAddTask={(taskName) => {
            const projectId = getProjectId(currentPath)
            if (projectId) {
              if (isProject(currentPath)) {
                store.addTask(projectId, taskName)
              } else {
                store.addSubtask(currentPath, taskName)
              }
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground">
      <TopBar />
      <div className="container mx-auto px-6 py-8">
        {shouldShowLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg text-muted-foreground">Loading...</span>
            </div>
          </div>
        ) : (
          pageContent()
        )}
      </div>

      {/* Dialogs */}
      <TaskCompletionDialog
        isOpen={showTaskCompletionDialog}
        onClose={cancelTaskCompletion}
        onConfirm={confirmTaskCompletion}
        taskName={pendingTask?.name || ""}
        subtaskCount={pendingTaskSubtaskCount}
      />

      <DeleteConfirmationDialog
        isOpen={showDeleteConfirmationDialog}
        onClose={cancelDeletion}
        onConfirm={confirmDeletion}
        itemName={pendingDeletionItem?.name || ""}
        itemType={pendingDeletionItem?.type || "task"}
        subtaskCount={pendingDeletionItem?.subtaskCount || 0}
      />
    </div>
  )
} 