"use client"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Check, ArrowRight, Clock, ArrowUp, Star, StarOff } from "lucide-react"
import { PendingReminderSubmenu } from "./pending-picker"
import type React from "react"

interface FocusContextMenuProps {
  children: React.ReactNode
  onComplete: () => void
  onNext: () => void
  onToggleDefer: () => void
  onTogglePrefer: () => void
  isDeferred: boolean
  isPreferred: boolean
  canShuffle?: boolean
  isPending: boolean
  onMarkPending: (remindInMs: number | null) => void
}

export function FocusContextMenu({ children, onComplete, onNext, onToggleDefer, onTogglePrefer, isDeferred, isPreferred, canShuffle = true, isPending, onMarkPending }: FocusContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onComplete} className="gap-2 transition-colors">
          <Check className="menu-icon" />
          Complete Task
        </ContextMenuItem>
        {canShuffle && (
          <ContextMenuItem onClick={onNext} className="gap-2 transition-colors">
            <ArrowRight className="menu-icon" />
            Next Task
          </ContextMenuItem>
        )}
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
        <PendingReminderSubmenu
          Sub={ContextMenuSub}
          SubTrigger={ContextMenuSubTrigger}
          SubContent={ContextMenuSubContent}
          Item={ContextMenuItem}
          Separator={ContextMenuSeparator}
          isPending={isPending}
          onMarkPending={onMarkPending}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}
