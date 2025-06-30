import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { EditableTitle, type EditableTitleRef } from "@/components/editable-title"
import { TaskOptionsMenu } from "@/components/task/task-options-menu"
import { forwardRef } from "react"

interface PageHeaderProps {
  title: string
  onTitleChange: (newTitle: string) => void
  isCompleted: boolean
  onRename: () => void
  onDelete: () => void
  showCompleted: boolean
  isProject: boolean
  shouldShowCompleteButton: boolean
  onComplete: () => void
  onUncomplete: () => void
}

export const PageHeader = forwardRef<EditableTitleRef, PageHeaderProps>(({
  title,
  onTitleChange,
  isCompleted,
  onRename,
  onDelete,
  showCompleted,
  isProject,
  shouldShowCompleteButton,
  onComplete,
  onUncomplete,
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
        <TaskOptionsMenu
          onRename={onRename}
          onDelete={onDelete}
          showCompleted={showCompleted}
          isProject={isProject}
        />
        {shouldShowCompleteButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onComplete}
            className="text-primary border-primary/50 hover:bg-primary/10 hover:text-primary hover:border-primary rounded-full px-4"
          >
            <Check className="h-4 w-4 mr-1" />
            Complete
          </Button>
        )}
        {isCompleted && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUncomplete}
            className="text-muted-foreground border-muted-foreground/30 hover:bg-muted/30 hover:text-foreground hover:border-muted-foreground rounded-full px-4"
          >
            <X className="h-4 w-4 mr-1" />
            Uncomplete
          </Button>
        )}
      </div>
    </div>
  )
})

PageHeader.displayName = "PageHeader" 