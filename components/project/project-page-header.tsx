import { PageHeader } from "@/components/page/page-header"
import { ProjectOptionsMenu } from "./project-options-menu"
import { forwardRef } from "react"
import type { EditableTitleRef } from "@/components/editable-title"

interface ProjectPageHeaderProps {
  title: string
  onTitleChange: (newTitle: string) => void
  onRename: () => void
  onDelete: () => void
  showCompleted: boolean
}

export const ProjectPageHeader = forwardRef<EditableTitleRef, ProjectPageHeaderProps>(({
  title,
  onTitleChange,
  onRename,
  onDelete,
  showCompleted,
}, ref) => {
  return (
    <PageHeader
      ref={ref}
      title={title}
      onTitleChange={onTitleChange}
      isCompleted={false} // Projects don't have completion state
      optionsMenu={
        <ProjectOptionsMenu
          onRename={onRename}
          onDelete={onDelete}
          showCompleted={showCompleted}
        />
      }
    />
  )
})

ProjectPageHeader.displayName = "ProjectPageHeader"