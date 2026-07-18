"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ProjectListView } from "@/components/project/project-list-view"
import { AddProjectForm } from "@/components/project/add-project-form"
import { TaskListView } from "@/components/task/task-list-view"
import { AddTaskForm } from "@/components/task/add-task-form"
import { ProjectPageHeader } from "@/components/project/project-page-header"
import { TaskPageHeader } from "@/components/task/task-page-header"
import { PageNavigation } from "@/components/page/page-navigation"
import { BreadcrumbPath } from "@/components/page/breadcrumb-path"
import { TasksView } from "@/components/tabs/tasks-view"
import { SearchInput } from "@/components/search-input"
import { SearchResults } from "@/components/search-results"
import { FocusButton } from "./focus-button"
import { type EditableTitleRef } from "@/components/editable-title"
import {
  getCurrentTaskViewData,
  useAppStore,
} from "@/store/app-store"
import { useFocusStore } from "@/store/focus-store"
import { useUIStore } from "@/store/ui-store"
import { getProjectId, isProject, isProjectList, isTask } from "@/lib/task-utils"
import { groupSearchResults, searchAllTasks } from "@/lib/search-utils"
import type { TaskPath } from "@/lib/task-path"

export function SessionBrowser({
  sessionId,
  onCreateFocusSession,
}: {
  sessionId: string
  onCreateFocusSession: (taskPath: TaskPath) => void
}) {
  const projects = useAppStore(state => state.projects)
  const showCompleted = useAppStore(state => state.showCompleted)
  const addProject = useAppStore(state => state.addProject)
  const updateProjectName = useAppStore(state => state.updateProjectName)
  const updateTaskName = useAppStore(state => state.updateTaskName)
  const updateTaskDescription = useAppStore(state => state.updateTaskDescription)
  const toggleTaskCompletion = useAppStore(state => state.toggleTaskCompletion)
  const toggleTaskDefer = useAppStore(state => state.toggleTaskDefer)
  const toggleTaskPrefer = useAppStore(state => state.toggleTaskPrefer)
  const toggleTaskOrdered = useAppStore(state => state.toggleTaskOrdered)
  const setTaskDueDate = useAppStore(state => state.setTaskDueDate)
  const attemptTaskCompletion = useUIStore(state => state.attemptTaskCompletion)
  const attemptDeletion = useUIStore(state => state.attemptDeletion)
  const session = useFocusStore(state => state.sessions.find(item => item.id === sessionId))
  const setBrowsePath = useFocusStore(state => state.setSessionBrowsePath)
  const setSessionScope = useFocusStore(state => state.setSessionScope)
  const titleRef = useRef<EditableTitleRef>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const path = session?.browsePath ?? []
  const {
    project: currentProject,
    taskChain,
    currentTask,
    tasks,
    orderedNumberMap,
  } = useMemo(
    () => getCurrentTaskViewData(projects, path, searchQuery, showCompleted),
    [projects, path, searchQuery, showCompleted]
  )

  const searchResults = useMemo(
    () => searchAllTasks(projects, searchQuery, path),
    [projects, searchQuery, path]
  )
  const { currentProject: currentProjectResults, otherProjects: otherProjectResults } = useMemo(
    () => groupSearchResults(searchResults),
    [searchResults]
  )
  const hasSearchResults = searchQuery.trim() && searchResults.length > 0

  useEffect(() => {
    setSearchQuery("")
  }, [path])

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  if (!session) return null

  const navigate = (nextPath: TaskPath) => setBrowsePath(sessionId, nextPath)
  const navigateBack = () => navigate(path.slice(0, -1))
  const focusHere = () => setSessionScope(sessionId, projects, path)

  const backLabel = isProject(path)
    ? "Projects"
    : path.length === 2
      ? currentProject?.name || "Project"
      : taskChain.at(-2)?.name || "Back"

  const rename = (name: string) => {
    if (isProject(path)) {
      const projectId = getProjectId(path)
      if (projectId) updateProjectName(projectId, name)
    } else if (isTask(path)) {
      updateTaskName(path, name)
    }
  }

  const hasIncompleteSubtasks = currentTask?.subtasks.some(task => !task.completed) ?? false
  const showComplete = !!currentTask && !currentTask.completed && !hasIncompleteSubtasks

  return (
    <TasksView>
      {isProjectList(path) ? (
        <div className="space-y-6">
          <h1 className="text-3xl font-light tracking-wide text-foreground">Projects</h1>
          <ProjectListView projects={projects} onSelectProject={projectId => navigate([projectId])} />
          <AddProjectForm onAddProject={addProject} />
        </div>
      ) : (
        <div className="space-y-6 pb-32">
          <PageNavigation backButtonText={backLabel} onBackClick={navigateBack} />

          {!isProject(path) && currentProject && (
            <BreadcrumbPath
              projectName={currentProject.name}
              taskChain={taskChain}
              path={path}
              contextPath={path}
              onNavigate={navigate}
            />
          )}

          {isProject(path) ? (
            <ProjectPageHeader
              ref={titleRef}
              title={currentProject?.name || ""}
              onTitleChange={rename}
              onRename={() => setTimeout(() => titleRef.current?.focus(), 0)}
              onDelete={() => attemptDeletion(path)}
              showCompleted={showCompleted}
              showSearch={showSearch}
              setShowSearch={setShowSearch}
            />
          ) : (
            <TaskPageHeader
              ref={titleRef}
              title={currentTask?.name || ""}
              onTitleChange={rename}
              description={currentTask?.description}
              onDescriptionChange={description => updateTaskDescription(path, description)}
              isCompleted={currentTask?.completed ?? false}
              isDeferred={currentTask?.priority === -1}
              isPreferred={currentTask?.priority === 1}
              onRename={() => setTimeout(() => titleRef.current?.focus(), 0)}
              onDelete={() => attemptDeletion(path)}
              onToggleDefer={() => toggleTaskDefer(path)}
              onTogglePrefer={() => toggleTaskPrefer(path)}
              onToggleOrdered={() => toggleTaskOrdered(path)}
              isOrdered={!!currentTask?.isOrdered}
              dueDate={currentTask?.dueDate}
              onDueDateChange={date => setTaskDueDate(path, date)}
              showCompleted={showCompleted}
              shouldShowCompleteButton={showComplete}
              onComplete={() => attemptTaskCompletion(path)}
              onUncomplete={() => toggleTaskCompletion(path)}
              showSearch={showSearch}
              setShowSearch={setShowSearch}
            />
          )}

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
                  onNavigateToResult={result => {
                    setSearchQuery("")
                    setShowSearch(false)
                    navigate(result.path)
                  }}
                  currentPath={path}
                  isInProject={isProject(path)}
                  query={searchQuery}
                />
              ) : searchQuery.trim() ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks found matching &quot;{searchQuery}&quot;</p>
                </div>
              ) : null}
            </div>
          )}

          {(!showSearch || !hasSearchResults) && (
            <div className="space-y-2">
              <TaskListView
                tasks={tasks}
                currentPath={path}
                parentIsOrdered={currentTask?.isOrdered}
                orderedNumberMap={orderedNumberMap}
                onNavigateToTask={taskId => navigate([...path, taskId])}
                onCreateFocusSession={onCreateFocusSession}
              />
            </div>
          )}
          <AddTaskForm currentPath={path} />
          <FocusButton onClick={focusHere} />
        </div>
      )}
    </TasksView>
  )
}
