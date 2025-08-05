"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, Clock, ArrowUp, Focus, Star, StarOff } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { useRef, useState } from "react"

interface TaskOptionsMenuProps {
  onRename: () => void
  onDelete: () => void
  onToggleDefer: () => void
  onTogglePrefer: () => void
  onFocus: () => void
  showCompleted: boolean
  isDeferred: boolean
  isPreferred: boolean
}

export function TaskOptionsMenu({ onRename, onDelete, onToggleDefer, onTogglePrefer, onFocus, showCompleted, isDeferred, isPreferred }: TaskOptionsMenuProps) {
  const toggleShowCompleted = useAppStore((state) => state.toggleShowCompleted)
  const [isOpen, setIsOpen] = useState(false)
  const shouldPreventAutofocus = useRef(false)

  const handleRename = () => {
    shouldPreventAutofocus.current = true
    // Close menu immediately without focus restoration, then call onRename
    setIsOpen(false)
    onRename()
  }

  const handleCloseAutoFocus = (e: Event) => {
    if (shouldPreventAutofocus.current) {
      e.preventDefault()
      shouldPreventAutofocus.current = false
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full opacity-70 hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onCloseAutoFocus={handleCloseAutoFocus}>
        <DropdownMenuItem onClick={handleRename}>
          <Edit className="menu-icon" />
          Rename Task
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onFocus}>
          <Focus className="menu-icon" />
          Focus on Task
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onTogglePrefer}>
          {isPreferred ? (
            <>
              <StarOff className="menu-icon" />
              Unprefer Task
            </>
          ) : (
            <>
              <Star className="menu-icon" />
              Prefer Task
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleDefer}>
          {isDeferred ? (
            <>
              <ArrowUp className="menu-icon" />
              Undefer Task
            </>
          ) : (
            <>
              <Clock className="menu-icon" />
              Defer Task
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleShowCompleted}>
          {showCompleted ? (
            <>
              <EyeOff className="menu-icon" />
              Hide Completed
            </>
          ) : (
            <>
              <Eye className="menu-icon" />
              Show Completed
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="menu-item-destructive">
          <Trash2 className="menu-icon" />
          Delete Task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
