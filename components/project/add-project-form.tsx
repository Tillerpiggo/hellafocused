"use client"
import { AddForm } from "@/components/ui/add-form"

interface AddProjectFormProps {
  onAddProject: (projectName: string) => void
}

export function AddProjectForm({ onAddProject }: AddProjectFormProps) {
  return (
    <AddForm
      placeholder="Add project..."
      onSubmit={onAddProject}
      inputId="add-project-input"
    />
  )
}
