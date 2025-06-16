"use client"
import { useAppStore } from "@/store/app-store"
import { AddForm } from "@/components/ui/add-form"

interface AddTaskFormProps {
  projectId: string
}

export function AddTaskForm({ projectId }: AddTaskFormProps) {
  const addSubtask = useAppStore((state) => state.addSubtask)
  const currentTaskPath = useAppStore((state) => state.currentTaskPath)

  const addTask = (taskName: string) => {
    // Use currentTaskPath to add subtask at the current level
    addSubtask(projectId, currentTaskPath, taskName)
  }

  const placeholderText = currentTaskPath.length === 0 ? "Add task..." : "Add subtask..."

  return (
    <AddForm
      placeholder={placeholderText}
      onSubmit={addTask}
      inputId="add-task-input"
    />
  )
}
