"use client"
import { ProjectListView } from "@/components/project/project-list-view"
import { AddProjectForm } from "@/components/project/add-project-form"
import { TaskListView } from "@/components/task/task-list-view"
import { FocusView } from "@/components/focus/focus-view"
import { SessionDock } from "@/components/focus/session-dock"
import { TaskCompletionDialog } from "@/components/task/task-completion-dialog"
import { DeleteConfirmationDialog } from "@/components/task/delete-confirmation-dialog"
import { ProjectPageHeader } from "@/components/project/project-page-header"
import { TaskPageHeader } from "@/components/task/task-page-header"
import { PageNavigation } from "@/components/page/page-navigation"
import { BreadcrumbPath } from "@/components/page/breadcrumb-path"

import { TopBar } from "@/components/top-bar"
import { useAppStore, getCurrentTasksForView, getCurrentTaskChain, getOrderedTaskNumberMap } from "@/store/app-store"
import { useSyncStore } from "@/store/sync-store"
import { useUIStore } from "@/store/ui-store"
import { Loader2, CheckSquare, TrendingUp } from "lucide-react"
import { AddTaskForm } from "@/components/task/add-task-form"
import { SearchInput } from "@/components/search-input"
import { SearchResults } from "@/components/search-results"
import { TasksView } from "@/components/tabs/tasks-view"
import { ProgressView } from "@/components/tabs/progress-view"
import { SettingsView } from "@/components/tabs/settings-view"
import { type EditableTitleRef } from "@/components/editable-title"
import { useRef, useMemo, useState, useEffect } from "react"
import { SidebarLayout } from "@/components/sidebar/sidebar-layout"
import { countSubtasksRecursively, findTaskAtPath, findProjectAtPath, getProjectId, isProject, isProjectList, isTask } from "@/lib/task-utils"
import { searchAllTasks, groupSearchResults } from "@/lib/search-utils"
import { useNavigationTransition } from "@/hooks/use-navigation-transition"
import { NavigationSkeleton } from "@/components/skeleton/navigation-skeleton"

export default function HomePage() {
  const projects = useAppStore(s => s.projects)
  const currentPath = useAppStore(s => s.currentPath)
  const { isTransitioning, justFinished } = useNavigationTransition(currentPath)
  const navigateBack = useAppStore(s => s.navigateBack)
  const navigateToPath = useAppStore(s => s.navigateToPath)
  const selectProject = useAppStore(s => s.selectProject)
  const updateProjectName = useAppStore(s => s.updateProjectName)
  const updateTaskName = useAppStore(s => s.updateTaskName)
  const updateTaskDescription = useAppStore(s => s.updateTaskDescription)
  const toggleTaskCompletion = useAppStore(s => s.toggleTaskCompletion)
  const toggleTaskDefer = useAppStore(s => s.toggleTaskDefer)
  const toggleTaskPrefer = useAppStore(s => s.toggleTaskPrefer)
  const toggleTaskOrdered = useAppStore(s => s.toggleTaskOrdered)
  const setTaskDueDate = useAppStore(s => s.setTaskDueDate)
  const addProject = useAppStore(s => s.addProject)
  const showCompleted = useAppStore(s => s.showCompleted)
  const searchQuery = useAppStore(s => s.searchQuery)
  const setSearchQuery = useAppStore(s => s.setSearchQuery)

  const { isInitialized } = useSyncStore()

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
  } = uiStore
  const titleRef = useRef<EditableTitleRef>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Tab state for sidebar navigation
  const [activeTab, setActiveTab] = useState('tasks')
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Search state
  const [showSearch, setShowSearch] = useState(false)
  
  const tabs = [
    { value: 'tasks', label: 'Tasks', icon: CheckSquare },
    { value: 'progress', label: 'Progress', icon: TrendingUp },
  ]

  // Show loading until authentication is complete
  const shouldShowLoading = !isInitialized

  // Clear search query when navigating
  useEffect(() => {
    setSearchQuery("")
  }, [currentPath, setSearchQuery])

  // Focus search input when showSearch becomes true
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  const tasksToDisplay = useMemo(
    () => isTransitioning ? [] : getCurrentTasksForView(projects, currentPath, searchQuery, showCompleted),
    [projects, currentPath, searchQuery, showCompleted, isTransitioning]
  )
  const orderedNumberMap = useMemo(
    () => isTransitioning ? {} : getOrderedTaskNumberMap(projects, currentPath),
    [projects, currentPath, isTransitioning]
  )
  const currentProject = isTransitioning ? null : findProjectAtPath(projects, currentPath)
  const taskChain = isTransitioning ? [] : getCurrentTaskChain(projects, currentPath)
  const currentTask = taskChain.length > 0 ? taskChain[taskChain.length - 1] : null
  const isCurrentTaskCompleted = currentTask?.completed || false

  // Search results (memoized)
  const searchResults = useMemo(
    () => isTransitioning ? [] : searchAllTasks(projects, searchQuery, currentPath),
    [projects, searchQuery, currentPath, isTransitioning]
  )
  const { currentProject: currentProjectResults, otherProjects: otherProjectResults } = useMemo(
    () => groupSearchResults(searchResults),
    [searchResults]
  )
  const hasSearchResults = searchQuery.trim() && searchResults.length > 0

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
        <FocusView />
        <SessionDock />
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

  const handleDescriptionChange = (newDescription: string) => {
    if (isTask(currentPath)) {
      updateTaskDescription(currentPath, newDescription)
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

  const handleRename = () => {
    setTimeout(() => titleRef.current?.focus(), 0)
  }

  const handleNavigateToSearchResult = (result: { path: string[] }) => {
    // Clear search when navigating to a result
    setSearchQuery("")
    setShowSearch(false)
    // Navigate to the task
    navigateToPath(result.path)
  }

  // Check if current task/project should show complete button
  const shouldShowCompleteButton = () => {
    if (isProjectList(currentPath) || isProject(currentPath)) return false

    // At task level - show if current task is not completed AND has no incomplete subtasks
    if (isCurrentTaskCompleted) return false
    const hasIncompleteSubtasks = currentTask?.subtasks.some((subtask) => !subtask.completed) || false
    return !hasIncompleteSubtasks
  }

  const renderTabContent = () => {
    if (activeTab === 'progress') {
      return <ProgressView projects={projects} />
    }

    if (activeTab === 'settings') {
      return <SettingsView />
    }

    // Default to tasks tab
    return <TasksView>{pageContent()}</TasksView>
  }

  const pageContent = () => {
    if (isTransitioning) {
      return <NavigationSkeleton />
    }

    const fadeClass = justFinished ? "animate-fade-in" : ""

    if (isProjectList(currentPath)) {
      return (
        <div className={`space-y-6 ${fadeClass}`}>
          <h1 className="text-3xl font-light tracking-wide text-foreground">Projects</h1>
          <ProjectListView projects={projects} />

          <AddProjectForm onAddProject={addProject} />
        </div>
      )
    }

    const currentProjectId = getProjectId(currentPath)
    if (!currentProjectId) return null

    return (
      <div className={`space-y-6 pb-32 ${fadeClass}`}>
        {/* Navigation and Focus button */}
        <PageNavigation
          backButtonText={getBackButtonText()}
          onBackClick={handleBackClick}
        />

        {/* Breadcrumb */}
        {!isProjectList(currentPath) && !isProject(currentPath) && currentProject && (
          <BreadcrumbPath
            projectName={currentProject.name}
            taskChain={taskChain}
          />
        )}

        {/* Title and Action Buttons */}
        {isProject(currentPath) ? (
          <ProjectPageHeader
            ref={titleRef}
            title={currentProject?.name || ""}
            onTitleChange={handleTitleChange}
            onRename={handleRename}
            onDelete={handleDelete}
            showCompleted={showCompleted}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
          />
        ) : (
          <TaskPageHeader
            ref={titleRef}
            title={taskChain[taskChain.length - 1]?.name || ""}
            onTitleChange={handleTitleChange}
            description={currentTask?.description}
            onDescriptionChange={handleDescriptionChange}
            isCompleted={isCurrentTaskCompleted}
            isDeferred={taskChain[taskChain.length - 1]?.priority === -1}
            isPreferred={taskChain[taskChain.length - 1]?.priority === 1}
            onRename={handleRename}
            onDelete={handleDelete}
            onToggleDefer={() => toggleTaskDefer(currentPath)}
            onTogglePrefer={() => toggleTaskPrefer(currentPath)}
            onToggleOrdered={() => toggleTaskOrdered(currentPath)}
            isOrdered={!!currentTask?.isOrdered}
            dueDate={currentTask?.dueDate}
            onDueDateChange={(date) => setTaskDueDate(currentPath, date)}
            showCompleted={showCompleted}
            shouldShowCompleteButton={shouldShowCompleteButton()}
            onComplete={() => attemptTaskCompletion(currentPath)}
            onUncomplete={() => toggleTaskCompletion(currentPath)}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
          />
        )}

        {/* Search Input and Results */}
        {showSearch && (
          <div className="space-y-4">
            <SearchInput
              ref={searchInputRef}
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tasks and subtasks..."
              className="w-full"
            />
            {hasSearchResults ? (
              <SearchResults
                results={searchResults}
                currentProjectResults={currentProjectResults}
                otherProjectResults={otherProjectResults}
                onNavigateToResult={handleNavigateToSearchResult}
                currentPath={currentPath}
                isInProject={isProject(currentPath)}
                query={searchQuery}
              />
            ) : searchQuery.trim() ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tasks found matching &quot;{searchQuery}&quot;</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Tasks */}
        {(!showSearch || !hasSearchResults) && (
          <div className="space-y-2">
            <TaskListView tasks={tasksToDisplay} currentPath={currentPath} parentIsOrdered={currentTask?.isOrdered} orderedNumberMap={orderedNumberMap} />
          </div>
        )}

        {/* Show AddTaskForm for all levels */}
        {!isProjectList(currentPath) && <AddTaskForm currentPath={currentPath} />}
      </div>
    )
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Top Bar */}
      <TopBar 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMenuOpen={isMobileMenuOpen}
      />
      
      {/* Loading state */}
      {shouldShowLoading ? (
        <main className="h-full flex items-center justify-center pt-14">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Initializing...</div>
          </div>
        </main>
      ) : (
        <SidebarLayout
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSidebarOpen={isMobileMenuOpen}
          setIsSidebarOpen={setIsMobileMenuOpen}
        >
          {renderTabContent()}
        </SidebarLayout>
      )}
      
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
      <SessionDock />
    </div>
  )
}
