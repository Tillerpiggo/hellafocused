import { PageHeader } from "@/components/page/page-header"
import { TaskOptionsMenu } from "./task-options-menu"
import { TaskDescriptionEditor, type TaskDescriptionEditorRef } from "./task-description-editor"
import { Button } from "@/components/ui/button"
import { Check, X, Search, Edit2, Calendar } from "lucide-react"
import { forwardRef, useState, useRef } from "react"
import type { EditableTitleRef } from "@/components/editable-title"

interface TaskPageHeaderProps {
  title: string
  onTitleChange: (newTitle: string) => void
  description?: string
  onDescriptionChange: (newDescription: string) => void
  isCompleted: boolean
  isDeferred: boolean
  isPreferred: boolean
  onRename: () => void
  onDelete: () => void
  onToggleDefer: () => void
  onTogglePrefer: () => void
  onFocus: () => void
  showCompleted: boolean
  shouldShowCompleteButton: boolean
  onComplete: () => void
  onUncomplete: () => void
}

export const TaskPageHeader = forwardRef<EditableTitleRef, TaskPageHeaderProps>(({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  isCompleted,
  isDeferred,
  isPreferred,
  onRename,
  onDelete,
  onToggleDefer,
  onTogglePrefer,
  onFocus,
  showCompleted,
  shouldShowCompleteButton,
  onComplete,
  onUncomplete,
}, ref) => {
  const [showDescriptionEditor, setShowDescriptionEditor] = useState(false)
  const descriptionEditorRef = useRef<TaskDescriptionEditorRef>(null)
  
  const handleSearchClick = () => {
    console.log("Search subtasks - coming soon")
  }

  const handleDetailsClick = () => {
    console.log('TaskPageHeader: handleDetailsClick called, showDescriptionEditor:', showDescriptionEditor)
    if (showDescriptionEditor && descriptionEditorRef.current) {
      // Save the description before closing
      console.log('TaskPageHeader: Saving description before closing editor')
      descriptionEditorRef.current.save()
    } else {
      setShowDescriptionEditor(true)
    }
  }

  const handleDueDateClick = () => {
    console.log("Set due date - coming soon")
  }

  const handleDescriptionSave = (newDescription: string) => {
    console.log('TaskPageHeader: handleDescriptionSave called with:', newDescription)
    console.log('TaskPageHeader: calling onDescriptionChange')
    onDescriptionChange(newDescription)
    setShowDescriptionEditor(false)
  }

  const handleDescriptionCancel = () => {
    console.log('TaskPageHeader: handleDescriptionCancel called')
    setShowDescriptionEditor(false)
  }

  const iconButtons = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSearchClick}
        className="h-8 w-8 rounded-full opacity-60 hover:opacity-100 transition-opacity"
        title="Search subtasks"
      >
        <Search className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDetailsClick}
        className={`h-8 w-8 rounded-full transition-all ${
          showDescriptionEditor 
            ? "bg-primary/20 opacity-100 hover:bg-primary/30" 
            : "opacity-60 hover:opacity-100"
        }`}
        title="Edit details"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDueDateClick}
        className="h-8 w-8 rounded-full opacity-60 hover:opacity-100 transition-opacity"
        title="Set due date"
      >
        <Calendar className="h-4 w-4" />
      </Button>
    </div>
  )

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
    <>
      <PageHeader
        ref={ref}
        title={title}
        onTitleChange={onTitleChange}
        isCompleted={isCompleted}
        iconButtons={iconButtons}
        optionsMenu={
          <TaskOptionsMenu
            onRename={onRename}
            onDelete={onDelete}
            onToggleDefer={onToggleDefer}
            onTogglePrefer={onTogglePrefer}
            onFocus={onFocus}
            showCompleted={showCompleted}
            isDeferred={isDeferred}
            isPreferred={isPreferred}
          />
        }
        actionButtons={actionButtons}
      />
      {showDescriptionEditor && (
        <>
          {console.log('TaskPageHeader: Rendering TaskDescriptionEditor with description:', description)}
          <TaskDescriptionEditor
            ref={descriptionEditorRef}
            description={description}
            onSave={handleDescriptionSave}
            onCancel={handleDescriptionCancel}
          />
        </>
      )}
    </>
  )
})

TaskPageHeader.displayName = "TaskPageHeader"