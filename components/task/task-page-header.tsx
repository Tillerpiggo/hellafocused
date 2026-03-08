import { PageHeader } from "@/components/page/page-header"
import { TaskOptionsMenu } from "./task-options-menu"
import { TaskDescriptionEditor, type TaskDescriptionEditorRef } from "./task-description-editor"
import { Button } from "@/components/ui/button"
import { Check, X, Search, Edit2, Calendar, ListOrdered } from "lucide-react"
import { forwardRef, useState, useRef } from "react"
import type { EditableTitleRef } from "@/components/editable-title"
import { LinkifiedText } from "@/components/ui/linkified-text"
import { DueDatePicker } from "./due-date-picker"
import { getDueStatus, formatDueDate } from "@/lib/due-date-utils"
import { cn } from "@/lib/utils"

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
  onToggleOrdered: () => void
  isOrdered: boolean
  showCompleted: boolean
  shouldShowCompleteButton: boolean
  onComplete: () => void
  onUncomplete: () => void
  dueDate?: string
  onDueDateChange: (date: string | undefined) => void
  showSearch: boolean
  setShowSearch: (show: boolean) => void
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
  onToggleOrdered,
  isOrdered,
  showCompleted,
  shouldShowCompleteButton,
  onComplete,
  onUncomplete,
  dueDate,
  onDueDateChange,
  showSearch,
  setShowSearch,
}, ref) => {
  const [showDescriptionEditor, setShowDescriptionEditor] = useState(false)
  const descriptionEditorRef = useRef<TaskDescriptionEditorRef>(null)
  
  const handleSearchClick = () => {
    // Close description editor if it's open
    if (showDescriptionEditor && descriptionEditorRef.current) {
      descriptionEditorRef.current.save()
      setShowDescriptionEditor(false)
    }
    setShowSearch(!showSearch)
  }

  const handleDetailsClick = () => {
    console.log('TaskPageHeader: handleDetailsClick called, showDescriptionEditor:', showDescriptionEditor)
    // Close search if it's open
    if (showSearch) {
      setShowSearch(false)
    }
    if (showDescriptionEditor && descriptionEditorRef.current) {
      // Save the description before closing
      console.log('TaskPageHeader: Saving description before closing editor')
      descriptionEditorRef.current.save()
    } else {
      setShowDescriptionEditor(true)
    }
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
        className={`h-8 w-8 rounded-full transition-all ${
          showSearch 
            ? "bg-primary/20 opacity-100 hover:bg-primary/30" 
            : "opacity-60 hover:opacity-100"
        }`}
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
        onClick={onToggleOrdered}
        className={`h-8 w-8 rounded-full transition-all ${
          isOrdered
            ? "bg-primary/20 opacity-100 hover:bg-primary/30"
            : "opacity-60 hover:opacity-100"
        }`}
        title={isOrdered ? "Subtasks are ordered" : "Order subtasks"}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <DueDatePicker
        dueDate={dueDate}
        onDateChange={onDueDateChange}
      >
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full h-8 transition-all",
            dueDate
              ? "px-3"
              : "w-8 justify-center opacity-60 hover:opacity-100 hover:bg-accent",
            dueDate && (() => {
              const status = getDueStatus(dueDate)
              switch (status) {
                case 'overdue': return 'text-due-overdue bg-due-overdueBg/60 hover:bg-due-overdueBg'
                case 'due-today': return 'text-due-today bg-due-todayBg/60 hover:bg-due-todayBg'
                case 'due-soon': return 'text-due-soon bg-due-soonBg/60 hover:bg-due-soonBg'
                default: return 'text-muted-foreground bg-due-futureBg/60 hover:bg-due-futureBg'
              }
            })()
          )}
          title={dueDate ? `Due: ${formatDueDate(dueDate)}` : "Set due date"}
        >
          {dueDate ? (
            <span className="text-xs font-medium">{formatDueDate(dueDate)}</span>
          ) : (
            <Calendar className="h-4 w-4" />
          )}
        </button>
      </DueDatePicker>
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
            onToggleOrdered={onToggleOrdered}
            showCompleted={showCompleted}
            isDeferred={isDeferred}
            isPreferred={isPreferred}
            isOrdered={isOrdered}
          />
        }
        actionButtons={actionButtons}
      />
      {!showDescriptionEditor && description && description.trim() && (
        <div className="mt-1">
          <div 
            className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => setShowDescriptionEditor(true)}
          >
            <LinkifiedText text={description} />
          </div>
        </div>
      )}
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