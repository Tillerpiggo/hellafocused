"use client"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Edit, Trash2 } from "lucide-react"
import type React from "react"

interface ProjectContextMenuProps {
  children: React.ReactNode
  onEdit: () => void
  onDelete: () => void
}

export function ProjectContextMenu({ children, onEdit, onDelete }: ProjectContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onEdit} className="gap-2 transition-colors">
          <Edit className="menu-icon" />
          Rename Project
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="gap-2 transition-colors menu-item-destructive">
          <Trash2 className="menu-icon" />
          Delete Project
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}