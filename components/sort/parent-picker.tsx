"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, ChevronRight, Folder, Circle, Star, Clock } from "lucide-react"
import { SearchInput } from "@/components/search-input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import { searchAllTasks } from "@/lib/search-utils"
import {
  findTaskAtPath,
  findProjectAtPath,
  getPathDisplayName,
  isProject,
  isProjectList,
} from "@/lib/task-utils"
import type { TaskData } from "@/lib/types"
import type { TaskPath } from "@/lib/task-path"

interface ParentPickerProps {
  currentPath: TaskPath
  onNavigate: (path: TaskPath) => void
}

const sortByPriorityAndPosition = (tasks: TaskData[]): TaskData[] =>
  [...tasks].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority
    if (a.position !== undefined && b.position !== undefined) return a.position - b.position
    if (a.position !== undefined && b.position === undefined) return -1
    if (a.position === undefined && b.position !== undefined) return 1
    return a.lastModificationDate.localeCompare(b.lastModificationDate)
  })

// Hierarchy browser for choosing where a scrap should live: drill into
// projects/tasks level by level, or jump anywhere via search.
export function ParentPicker({ currentPath, onNavigate }: ParentPickerProps) {
  const projects = useAppStore((state) => state.projects)
  const [query, setQuery] = useState("")

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    return searchAllTasks(projects, query, currentPath)
      .filter((result) => !result.task.completed)
      .slice(0, 30)
  }, [projects, query, currentPath])

  const navigationItems = useMemo(() => {
    if (isProjectList(currentPath)) {
      return projects.map((project) => ({
        id: project.id,
        name: project.name,
        type: "project" as const,
        path: [project.id],
        hasChildren: project.tasks.some((task) => !task.completed),
        priority: undefined as number | undefined,
      }))
    }

    const project = findProjectAtPath(projects, currentPath)
    if (!project) return []

    const tasks = isProject(currentPath)
      ? project.tasks
      : findTaskAtPath(projects, currentPath)?.subtasks ?? []

    return sortByPriorityAndPosition(tasks.filter((task) => !task.completed)).map((task) => ({
      id: task.id,
      name: task.name,
      type: "task" as const,
      path: [...currentPath, task.id],
      hasChildren: task.subtasks.some((subtask) => !subtask.completed),
      priority: task.priority as number | undefined,
    }))
  }, [projects, currentPath])

  const handlePickSearchResult = (path: TaskPath) => {
    setQuery("")
    onNavigate(path)
  }

  const getBackButtonText = () => {
    if (isProject(currentPath)) return "Projects"
    return getPathDisplayName(projects, currentPath.slice(0, -1))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search for a destination…"
      />

      {query.trim() ? (
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {searchResults.map((result) => (
            <button
              key={result.path.join("/")}
              type="button"
              onClick={() => handlePickSearchResult(result.path)}
              className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{result.task.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {result.breadcrumb.join(" › ")}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
          {searchResults.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No destinations match &quot;{query}&quot;
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex h-8 items-center">
            {isProjectList(currentPath) ? (
              <h3 className="px-1 text-sm font-medium text-muted-foreground">Projects</h3>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(currentPath.slice(0, -1))}
                className="max-w-full truncate px-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{getBackButtonText()}</span>
              </Button>
            )}
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.path)}
                className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {item.type === "project" ? (
                    <Folder className="h-4 w-4 shrink-0 text-blue-600" />
                  ) : (
                    <Circle
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.priority === 1 ? "text-priority-icon/60" : "text-muted-foreground"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "truncate font-medium",
                      item.type === "task" && item.priority === 1 && "text-priority-text",
                      item.type === "task" && item.priority === -1 && "text-muted-foreground"
                    )}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.type === "task" && item.priority === 1 && (
                    <Star className="h-4 w-4 fill-priority-fill/60 text-priority-icon/60" />
                  )}
                  {item.type === "task" && item.priority === -1 && (
                    <Clock className="h-4 w-4 text-slate-500/60 dark:text-slate-400/70" />
                  )}
                  {item.hasChildren && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
            ))}

            {navigationItems.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {isProjectList(currentPath)
                  ? "No projects yet — create one from the Tasks tab first."
                  : "Nothing underneath — add the scrap right here."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
