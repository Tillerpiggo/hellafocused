"use client"
import { useAppStore } from "@/store/app-store"
import { AddForm } from "@/components/ui/add-form"
import { isProject } from "@/lib/task-utils"

interface AddTaskFormProps {
  currentPath: string[] // Unified path including project and task hierarchy
}

export function AddTaskForm({ currentPath }: AddTaskFormProps) {
  const addSubtaskToParent = useAppStore((state) => state.addSubtaskToParent)

  const addTask = (taskName: string) => {
    addSubtaskToParent(currentPath, taskName)
  }

  const placeholderText = isProject(currentPath) ? "Add task..." : "Add subtask..."

  return (
    <AddForm
      placeholder={placeholderText}
      onSubmit={addTask}
      inputId="add-task-input"
    />
  )
}
