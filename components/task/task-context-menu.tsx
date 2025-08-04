"use client"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Edit, Check, X, Trash2, Move, Clock, ArrowUp, Focus, Star, StarOff } from "lucide-react"
import type React from "react"

interface TaskContextMenuProps {
  children: React.ReactNode
  onEdit: () => void
  onToggleComplete: () => void
  onToggleDefer: () => void
  onTogglePrefer: () => void
  onDelete: () => void
  onMove: () => void
  onFocus: () => void
  isCompleted: boolean
  isDeferred: boolean
  isPreferred: boolean
}

export function TaskContextMenu({ children, onEdit, onToggleComplete, onToggleDefer, onTogglePrefer, onDelete, onMove, onFocus, isCompleted, isDeferred, isPreferred }: TaskContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
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
        <ContextMenuItem onClick={onEdit} className="gap-2 transition-colors">
          <Edit className="menu-icon" />
          Rename Task
        </ContextMenuItem>
        <ContextMenuItem onClick={onMove} className="gap-2 transition-colors">
          <Move className="menu-icon" />
          Move Task
        </ContextMenuItem>
        <ContextMenuItem onClick={onFocus} className="gap-2 transition-colors">
          <Focus className="menu-icon" />
          Focus on Task
        </ContextMenuItem>
        <ContextMenuItem onClick={onToggleDefer} className="gap-2 transition-colors">
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
        </ContextMenuItem>
        <ContextMenuItem onClick={onTogglePrefer} className="gap-2 transition-colors">
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
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="gap-2 transition-colors menu-item-destructive">
          <Trash2 className="menu-icon" />
          Delete Task
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
