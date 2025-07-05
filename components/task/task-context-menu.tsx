"use client"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Edit, Check, X, Trash2 } from "lucide-react"
import type React from "react"

interface TaskContextMenuProps {
  children: React.ReactNode
  onEdit: () => void
  onToggleComplete: () => void
  onDelete: () => void
  isCompleted: boolean
}

export function TaskContextMenu({ children, onEdit, onToggleComplete, onDelete, isCompleted }: TaskContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onEdit} className="gap-2 transition-colors">
          <Edit className="menu-icon" />
          Rename Task
        </ContextMenuItem>
        <ContextMenuItem onClick={onToggleComplete} className="gap-2 transition-colors">
          {isCompleted ? (
            <>
              <X className="menu-icon" />
              Mark Incomplete
            </>
          ) : (
            <>
              <Check className="menu-icon" />
              Mark Complete
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="gap-2 transition-colors menu-item-destructive">
          <Trash2 className="menu-icon" />
          Delete Task
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
