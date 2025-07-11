import { getProjectId } from "./task-utils"
import type { ProjectData, TaskData } from "./types"

export interface SearchResult {
  task: TaskData
  path: string[] // Full path including project ID
  breadcrumb: string[] // Human-readable breadcrumb path
  projectName: string
  isInCurrentProject: boolean
  isInCurrentPath: boolean
}

/**
 * Comprehensive search across all projects and tasks
 */
export function searchAllTasks(
  projects: ProjectData[],
  query: string,
  currentPath: string[] = []
): SearchResult[] {
  if (!query.trim()) return []

  const searchLower = query.toLowerCase().trim()
  const results: SearchResult[] = []
  
  // Get current project ID if we're in a project
  const currentProjectId = currentPath.length > 0 ? currentPath[0] : null

  // Search through all projects
  for (const project of projects) {
    const isCurrentProject = project.id === currentProjectId
    
    // Search all tasks in this project
    const projectResults = searchTasksRecursively(
      project.tasks,
      searchLower,
      [project.id], // Start with project ID in path
      [project.name], // Start with project name in breadcrumb
      project.name,
      isCurrentProject,
      currentPath
    )
    
    results.push(...projectResults)
  }

  // Sort results: current project first, then by relevance (exact matches first)
  return results.sort((a, b) => {
    // Current project results first
    if (a.isInCurrentProject && !b.isInCurrentProject) return -1
    if (!a.isInCurrentProject && b.isInCurrentProject) return 1
    
    // Within same project category, exact matches first
    const aExactMatch = a.task.name.toLowerCase() === searchLower
    const bExactMatch = b.task.name.toLowerCase() === searchLower
    if (aExactMatch && !bExactMatch) return -1
    if (!aExactMatch && bExactMatch) return 1
    
    // Then by alphabetical order
    return a.task.name.localeCompare(b.task.name)
  })
}

/**
 * Recursively search tasks and their subtasks
 */
function searchTasksRecursively(
  tasks: TaskData[],
  searchLower: string,
  currentPath: string[],
  currentBreadcrumb: string[],
  projectName: string,
  isCurrentProject: boolean,
  userCurrentPath: string[]
): SearchResult[] {
  const results: SearchResult[] = []

  for (const task of tasks) {
    const taskPath = [...currentPath, task.id]
    const taskBreadcrumb = [...currentBreadcrumb, task.name]
    
    // Check if this task matches the search
    if (task.name.toLowerCase().includes(searchLower)) {
      // Check if this result is in the current path
      const isInCurrentPath = userCurrentPath.length > 0 && 
        taskPath.slice(0, userCurrentPath.length).join('/') === userCurrentPath.join('/')
      const isInCurrentProject = getProjectId(taskPath) === getProjectId(userCurrentPath)

      results.push({
        task,
        path: taskPath,
        breadcrumb: taskBreadcrumb,
        projectName,
        isInCurrentProject,
        isInCurrentPath
      })
    }

    // Recursively search subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      const subtaskResults = searchTasksRecursively(
        task.subtasks,
        searchLower,
        taskPath,
        taskBreadcrumb,
        projectName,
        isCurrentProject,
        userCurrentPath
      )
      results.push(...subtaskResults)
    }
  }

  return results
}

/**
 * Group search results by location (current project vs other projects)
 */
export function groupSearchResults(results: SearchResult[]): {
  currentProject: SearchResult[]
  otherProjects: SearchResult[]
} {
  const currentProject: SearchResult[] = []
  const otherProjects: SearchResult[] = []

  for (const result of results) {
    if (result.isInCurrentProject) {
      currentProject.push(result)
    } else {
      otherProjects.push(result)
    }
  }

  return { currentProject, otherProjects }
} 