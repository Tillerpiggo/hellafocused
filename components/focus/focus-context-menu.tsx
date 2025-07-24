"use client"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Check, ArrowRight, Clock, ArrowUp } from "lucide-react"
import type React from "react"

interface FocusContextMenuProps {
  children: React.ReactNode
  onComplete: () => void
  onNext: () => void
  onToggleDefer: () => void
  isDeferred: boolean
}

export function FocusContextMenu({ children, onComplete, onNext, onToggleDefer, isDeferred }: FocusContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onComplete} className="gap-2 transition-colors">
          <Check className="menu-icon" />
          Complete Task
        </ContextMenuItem>
        <ContextMenuItem onClick={onNext} className="gap-2 transition-colors">
          <ArrowRight className="menu-icon" />
          Next Task
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
      </ContextMenuContent>
    </ContextMenu>
  )
}