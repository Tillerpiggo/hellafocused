import { EditableTitle, type EditableTitleRef } from "@/components/editable-title"
import { forwardRef } from "react"
import type React from "react"

interface PageHeaderProps {
  title: string
  onTitleChange: (newTitle: string) => void
  isCompleted: boolean
  optionsMenu: React.ReactNode
  actionButtons?: React.ReactNode
}

export const PageHeader = forwardRef<EditableTitleRef, PageHeaderProps>(({
  title,
  onTitleChange,
  isCompleted,
  optionsMenu,
  actionButtons,
}, ref) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h1 className="text-3xl font-light tracking-wide text-foreground">
          <EditableTitle
            ref={ref}
            value={title}
            onChange={onTitleChange}
            className="text-3xl font-light tracking-wide text-foreground"
            isCompleted={isCompleted}
          />
        </h1>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {optionsMenu}
        {actionButtons}
      </div>
    </div>
  )
})

PageHeader.displayName = "PageHeader" 