import { PageHeader } from "@/components/page/page-header"
import { TaskOptionsMenu } from "./task-options-menu"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { forwardRef } from "react"
import type { EditableTitleRef } from "@/components/editable-title"

interface TaskPageHeaderProps {
  title: string
  onTitleChange: (newTitle: string) => void
  isCompleted: boolean
  isDeferred: boolean
  onRename: () => void
  onDelete: () => void
  onToggleDefer: () => void
  showCompleted: boolean
  shouldShowCompleteButton: boolean
  onComplete: () => void
  onUncomplete: () => void
}

export const TaskPageHeader = forwardRef<EditableTitleRef, TaskPageHeaderProps>(({
  title,
  onTitleChange,
  isCompleted,
  isDeferred,
  onRename,
  onDelete,
  onToggleDefer,
  showCompleted,
  shouldShowCompleteButton,
  onComplete,
  onUncomplete,
}, ref) => {
  const actionButtons = (
    <>
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
    </>
  )

  return (
    <PageHeader
      ref={ref}
      title={title}
      onTitleChange={onTitleChange}
      isCompleted={isCompleted}
      optionsMenu={
        <TaskOptionsMenu
          onRename={onRename}
          onDelete={onDelete}
          onToggleDefer={onToggleDefer}
          showCompleted={showCompleted}
          isDeferred={isDeferred}
        />
      }
      actionButtons={actionButtons}
    />
  )
})

TaskPageHeader.displayName = "TaskPageHeader"