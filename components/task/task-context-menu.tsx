"use client"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Edit, Check, X, Trash2, Move } from "lucide-react"
import type React from "react"

interface TaskContextMenuProps {
  children: React.ReactNode
  onEdit: () => void
  onToggleComplete: () => void
  onDelete: () => void
  onMove: () => void
  isCompleted: boolean
}

export function TaskContextMenu({ children, onEdit, onToggleComplete, onDelete, onMove, isCompleted }: TaskContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onEdit} className="gap-2 transition-colors">
          <Edit className="menu-icon" />
          Rename Task
        </ContextMenuItem>
        <ContextMenuItem onClick={onMove} className="gap-2 transition-colors">
          <Move className="menu-icon" />
          Move Task
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
