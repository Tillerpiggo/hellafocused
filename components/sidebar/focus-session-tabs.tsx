"use client"

import { useEffect, useRef, useState } from "react"
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useFocusStore } from "@/store/focus-store"
import { useAppStore } from "@/store/app-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import type { FocusSession } from "@/lib/types"

interface FocusSessionTabsProps {
  activeTab: string
  onTabChange: (value: string) => void
  onNavigate?: () => void
}

function SessionRow({
  session,
  active,
  onOpen,
  onNavigate,
}: {
  session: FocusSession
  active: boolean
  onOpen: () => void
  onNavigate?: () => void
}) {
  const renameSession = useFocusStore(state => state.renameSession)
  const removeSession = useFocusStore(state => state.removeSession)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(session.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setDraftName(session.name), [session.name])
  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commitName = () => {
    const trimmed = draftName.trim()
    if (trimmed) renameSession(session.id, trimmed)
    else setDraftName(session.name)
    setEditing(false)
  }

  const closeSession = () => {
    removeSession(session.id)
    if (active) onNavigate?.()
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "group relative flex h-12 items-center overflow-hidden rounded-lg pl-4 pr-2 text-sm font-medium transition-all duration-200 ease-out",
            "focus-within:ring-1 focus-within:ring-ring",
            active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {editing ? (
            <input
              ref={inputRef}
              value={draftName}
              onChange={event => setDraftName(event.target.value)}
              onBlur={commitName}
              onKeyDown={event => {
                if (event.key === "Enter") commitName()
                if (event.key === "Escape") {
                  setDraftName(session.name)
                  setEditing(false)
                }
              }}
              className="min-w-0 flex-1 border-b border-current/40 bg-transparent text-sm font-medium outline-none"
            />
          ) : (
            <>
              <button
                onClick={onOpen}
                className="absolute inset-0 rounded-lg"
                aria-label={`Open ${session.name}`}
              />
              <span className="pointer-events-none relative z-[1] min-w-0 flex-1 truncate text-left">
                {session.name}
              </span>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg opacity-0 transition-opacity group-hover:opacity-70 focus:opacity-100",
                  active ? "hover:bg-primary-foreground/10" : "hover:bg-foreground/5"
                )}
                aria-label={`Options for ${session.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={closeSession} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Close permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => setEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" /> Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={closeSession} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Close permanently
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function FocusSessionTabs({ activeTab, onTabChange, onNavigate }: FocusSessionTabsProps) {
  const sessions = useFocusStore(state => state.sessions)
  const switchSession = useFocusStore(state => state.switchSession)
  const createBrowseSession = useFocusStore(state => state.createBrowseSession)
  const projects = useAppStore(state => state.projects)

  if (sessions.length === 0) return null

  return (
    <div className="mt-1 space-y-1">
      {sessions.map(session => (
        <SessionRow
          key={session.id}
          session={session}
          active={activeTab === `focus:${session.id}`}
          onOpen={() => {
            switchSession(session.id, projects)
            onTabChange(`focus:${session.id}`)
          }}
          onNavigate={onNavigate}
        />
      ))}
      <button
        onClick={() => onTabChange(`focus:${createBrowseSession()}`)}
        className={cn(
          "session-ghost-row flex h-12 w-full items-center rounded-lg pl-4 pr-4 text-left text-sm font-medium text-muted-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
      >
        <Plus className="mr-3 h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">New session</span>
      </button>
    </div>
  )
}
