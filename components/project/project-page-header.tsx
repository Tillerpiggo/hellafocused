import { PageHeader } from "@/components/page/page-header"
import { ProjectOptionsMenu } from "./project-options-menu"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { forwardRef } from "react"
import type { EditableTitleRef } from "@/components/editable-title"

interface ProjectPageHeaderProps {
  title: string
  onTitleChange: (newTitle: string) => void
  onRename: () => void
  onDelete: () => void
  showCompleted: boolean
  showSearch: boolean
  setShowSearch: (show: boolean) => void
}

export const ProjectPageHeader = forwardRef<EditableTitleRef, ProjectPageHeaderProps>(({
  title,
  onTitleChange,
  onRename,
  onDelete,
  showCompleted,
  showSearch,
  setShowSearch,
}, ref) => {
  const handleSearchClick = () => {
    setShowSearch(!showSearch)
  }
  return (
    <PageHeader
      ref={ref}
      title={title}
      onTitleChange={onTitleChange}
      isCompleted={false} // Projects don't have completion state
      iconButtons={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSearchClick}
          className={`h-8 w-8 rounded-full transition-all ${
            showSearch 
              ? "bg-primary/20 opacity-100 hover:bg-primary/30" 
              : "opacity-60 hover:opacity-100"
          }`}
        >
          <Search className="h-4 w-4" />
        </Button>
      }
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