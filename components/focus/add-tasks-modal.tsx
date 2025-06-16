"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/store/app-store"
import { ChevronRight, Home, Plus } from "lucide-react"
import { TaskItem } from "@/components/task/task-item"
import type { TaskItemData } from "@/lib/types"

interface AddTasksModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddTasksModal({ isOpen, onClose }: AddTasksModalProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [newTaskName, setNewTaskName] = useState("")
  const { projects, selectedProjectId, addSubtask } = useAppStore()

  const currentProject = projects.find((p) => p.id === selectedProjectId)

  // Reset path when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPath([])
      setNewTaskName("")
    }
  }, [isOpen])

  // Get current tasks to display
  const getCurrentTasks = (): TaskItemData[] => {
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

  // Get breadcrumb chain
  const getBreadcrumbChain = () => {
    if (!currentProject) return []

    const chain = [{ id: "project", name: currentProject.name }]
    let tasks = currentProject.tasks

    for (const taskId of currentPath) {
      const task = tasks.find((t) => t.id === taskId)
      if (task) {
        chain.push({ id: task.id, name: task.name })
        tasks = task.subtasks
      }
    }
    return chain
  }

  const handleNavigateToTask = (taskId: string) => {
    setCurrentPath([...currentPath, taskId])
  }

  const handleNavigateToLevel = (index: number) => {
    if (index === 0) {
      setCurrentPath([])
    } else {
      setCurrentPath(currentPath.slice(0, index))
    }
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskName.trim() && selectedProjectId) {
      addSubtask(selectedProjectId, currentPath, newTaskName.trim())
      setNewTaskName("")
    }
  }

  const breadcrumbChain = getBreadcrumbChain()
  const currentTasks = getCurrentTasks()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Tasks</DialogTitle>
        </DialogHeader>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground border-b pb-3">
          {breadcrumbChain.map((item, index) => (
            <div key={item.id} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3" />}
              <button onClick={() => handleNavigateToLevel(index)} className="hover:text-foreground transition-colors">
                {index === 0 ? (
                  <div className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {item.name}
                  </div>
                ) : (
                  item.name
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <Input
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {/* Current Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {currentTasks.length > 0 ? (
            currentTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <TaskItem task={task} projectId={selectedProjectId!} currentPathInProject={currentPath} />
                </div>
                {task.subtasks.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => handleNavigateToTask(task.id)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">No tasks yet. Add one above!</div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
