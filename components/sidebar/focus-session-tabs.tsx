"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  DragDropContext,
  Draggable,
  Droppable,
  useKeyboardSensor,
  useTouchSensor,
  type BeforeCapture,
  type DragUpdate,
  type DropResult,
  type Sensor,
} from "@hello-pangea/dnd"
import { CheckCircle2, Copy, Hourglass, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useFocusStore } from "@/store/focus-store"
import { useAppStore } from "@/store/app-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import type { FocusSession } from "@/lib/types"
import { PENDING_PRESETS } from "@/components/focus/pending-picker"
import { useOptionMouseSensor } from "./use-option-mouse-sensor"

const focusSessionSensors: Sensor[] = [
  useOptionMouseSensor,
  useKeyboardSensor,
  useTouchSensor,
]

interface FocusSessionTabsProps {
  activeTab: string
  onTabChange: (value: string) => void
}

interface DragOrigin {
  sessionId: string
  top: number
  left: number
  width: number
  height: number
  rowStep: number
}

function pendingTooltip(session: FocusSession): string {
  const reason = session.pendingReason?.trim()
  if (session.reminderFired) return reason ? `Check on this — waiting on ${reason}` : "Check on this"
  return reason ? `Waiting on ${reason}` : "Pending"
}

// Waiting rows fade back ("rest easy"); fired rows keep full strength ("check on this")
function isWaiting(session: FocusSession): boolean {
  return !!session.pending && !session.reminderFired
}

// Sized to sit centered in the row's 16px left-padding gutter
function pendingDotClass(session: FocusSession, active: boolean): string {
  return cn(
    "absolute left-[5px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full",
    session.reminderFired
      ? active ? "bg-primary-foreground" : "bg-primary"
      : active ? "bg-primary-foreground/40" : "bg-muted-foreground/40"
  )
}

function StationarySessionRow({
  session,
  active,
  origin,
  displacedDown,
}: {
  session: FocusSession
  active: boolean
  origin: DragOrigin
  displacedDown: boolean
}) {
  return createPortal(
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed flex items-center overflow-hidden rounded-lg pl-4 pr-2 text-sm font-medium transition-transform duration-200 ease-out",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground"
      )}
      style={{
        top: origin.top,
        left: origin.left,
        width: origin.width,
        height: origin.height,
        transform: displacedDown ? `translateY(${origin.rowStep}px)` : undefined,
        zIndex: 60,
      }}
    >
      {session.pending && <span className={pendingDotClass(session, active)} />}
      <span className="min-w-0 flex-1 truncate text-left">{session.name}</span>
      <span className="grid h-8 w-8 shrink-0 place-items-center opacity-0">
        <MoreHorizontal className="h-4 w-4" />
      </span>
    </div>,
    document.body
  )
}

function CopyBaseSessionRow({
  sessionId,
  index,
}: {
  sessionId: string
  index: number
}) {
  return (
    <Draggable
      draggableId={`copy-base:${sessionId}`}
      index={index}
      isDragDisabled
    >
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          aria-hidden
          className="pointer-events-none h-12 opacity-0"
          style={provided.draggableProps.style}
        />
      )}
    </Draggable>
  )
}

function SessionRow({
  session,
  index,
  active,
  isDuplicateDragging,
  onOpen,
  onClose,
}: {
  session: FocusSession
  index: number
  active: boolean
  isDuplicateDragging: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const renameSession = useFocusStore(state => state.renameSession)
  const markPending = useFocusStore(state => state.markPending)
  const resolvePending = useFocusStore(state => state.resolvePending)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(session.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setDraftName(session.name), [session.name])
  useEffect(() => {
    if (!editing) return

    // Wait until the menu has closed and finished restoring focus, then move
    // focus back to the rename field and select the complete session title.
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })

    return () => cancelAnimationFrame(frame)
  }, [editing])

  const commitName = () => {
    const trimmed = draftName.trim()
    if (trimmed) renameSession(session.id, trimmed)
    else setDraftName(session.name)
    setEditing(false)
  }

  const closeSession = () => {
    onClose()
  }

  return (
    <Draggable
      draggableId={session.id}
      index={index}
      isDragDisabled={editing}
      disableInteractiveElementBlocking
    >
      {(provided, snapshot) => {
        const getStyle = () => {
          if (snapshot.isDropAnimating && snapshot.dropAnimation) {
            const { moveTo, curve } = snapshot.dropAnimation
            return {
              ...provided.draggableProps.style,
              transform: `translate(${moveTo.x}px, ${moveTo.y}px)`,
              transition: `all ${curve} 0.2s`,
            }
          }

          return {
            ...provided.draggableProps.style,
            zIndex: snapshot.isDragging ? 9999 : "auto",
          }
        }

        const sessionRow = (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                style={getStyle()}
                className={cn(
                  "group relative flex h-12 items-center overflow-hidden rounded-lg pl-4 pr-2 text-sm font-medium transition-all duration-200 ease-out",
                  "focus-within:ring-1 focus-within:ring-ring",
                  snapshot.isDragging && !snapshot.isDropAnimating && "z-50 opacity-80",
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
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium outline-none"
                  />
                ) : (
                  <>
                    <button
                      onClick={onOpen}
                      className="absolute inset-0 rounded-lg"
                      aria-label={`Open ${session.name}`}
                    />
                    {session.pending && (
                      <span
                        title={pendingTooltip(session)}
                        className={cn(pendingDotClass(session, active), "z-[1]")}
                      />
                    )}
                    <span className="pointer-events-none relative z-[1] min-w-0 flex-1 truncate text-left">
                      {session.name}
                    </span>
                  </>
                )}

                {snapshot.isDragging && isDuplicateDragging ? (
                  <span
                    className={cn(
                      "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      active ? "bg-primary-foreground/10" : "bg-foreground/5"
                    )}
                    aria-hidden
                  >
                    <Copy className="h-4 w-4" />
                  </span>
                ) : (
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
                      {session.pending && (
                        <DropdownMenuItem onClick={() => resolvePending(session.id)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve pending
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Hourglass className="mr-2 h-4 w-4" />
                          {session.pending ? "Remind again" : "Mark pending"}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {PENDING_PRESETS.map(preset => (
                            <DropdownMenuItem key={preset.ms} onClick={() => markPending(session.id, preset.ms)}>
                              {preset.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem onClick={() => markPending(session.id, null)} className="text-muted-foreground">
                            No reminder
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem onClick={closeSession} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Close permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Rename
              </ContextMenuItem>
              {session.pending && (
                <ContextMenuItem onClick={() => resolvePending(session.id)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve pending
                </ContextMenuItem>
              )}
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <Hourglass className="mr-2 h-4 w-4" />
                  {session.pending ? "Remind again" : "Mark pending"}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {PENDING_PRESETS.map(preset => (
                    <ContextMenuItem key={preset.ms} onClick={() => markPending(session.id, preset.ms)}>
                      {preset.label}
                    </ContextMenuItem>
                  ))}
                  <ContextMenuItem onClick={() => markPending(session.id, null)} className="text-muted-foreground">
                    No reminder
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuItem onClick={closeSession} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Close permanently
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )

        // The sidebar's backdrop-filter establishes a containing block for fixed
        // descendants. Lift the active row to the document root so the drag
        // library's fixed coordinates stay aligned with the pointer.
        return snapshot.isDragging
          ? createPortal(sessionRow, document.body)
          : sessionRow
      }}
    </Draggable>
  )
}

export function FocusSessionTabs({ activeTab, onTabChange }: FocusSessionTabsProps) {
  const sessions = useFocusStore(state => state.sessions)
  const switchSession = useFocusStore(state => state.switchSession)
  const createBrowseSession = useFocusStore(state => state.createBrowseSession)
  const reorderSessions = useFocusStore(state => state.reorderSessions)
  const duplicateSession = useFocusStore(state => state.duplicateSession)
  const removeSession = useFocusStore(state => state.removeSession)
  const projects = useAppStore(state => state.projects)
  const altPressedRef = useRef(false)
  const duplicateDragRef = useRef(false)
  const duplicateSourceWasSelectedRef = useRef(false)
  const [duplicateBaseId, setDuplicateBaseId] = useState<string | null>(null)
  const [duplicateDragVisual, setDuplicateDragVisual] = useState<DragOrigin | null>(null)
  const [duplicateBaseDisplacedDown, setDuplicateBaseDisplacedDown] = useState(false)

  useEffect(() => {
    const handleModifierChange = (event: KeyboardEvent) => {
      const isAltPressed = event.key === "Alt"
        ? event.type === "keydown"
        : event.altKey
      altPressedRef.current = isAltPressed
    }
    const handlePointerModifier = (event: MouseEvent | PointerEvent) => {
      altPressedRef.current = event.altKey
    }
    const clearModifier = () => {
      altPressedRef.current = false
    }

    window.addEventListener("keydown", handleModifierChange)
    window.addEventListener("keyup", handleModifierChange)
    window.addEventListener("mousedown", handlePointerModifier, true)
    window.addEventListener("mousemove", handlePointerModifier, true)
    window.addEventListener("mouseup", handlePointerModifier, true)
    window.addEventListener("pointerdown", handlePointerModifier, true)
    window.addEventListener("pointermove", handlePointerModifier, true)
    window.addEventListener("pointerup", handlePointerModifier, true)
    window.addEventListener("blur", clearModifier)
    return () => {
      window.removeEventListener("keydown", handleModifierChange)
      window.removeEventListener("keyup", handleModifierChange)
      window.removeEventListener("mousedown", handlePointerModifier, true)
      window.removeEventListener("mousemove", handlePointerModifier, true)
      window.removeEventListener("mouseup", handlePointerModifier, true)
      window.removeEventListener("pointerdown", handlePointerModifier, true)
      window.removeEventListener("pointermove", handlePointerModifier, true)
      window.removeEventListener("pointerup", handlePointerModifier, true)
      window.removeEventListener("blur", clearModifier)
    }
  }, [])

  const sortedSessions = sessions
    .slice()
    .sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)

  const handleBeforeCapture = (capture: BeforeCapture) => {
    const shouldDuplicate = altPressedRef.current
    duplicateDragRef.current = shouldDuplicate
    duplicateSourceWasSelectedRef.current = shouldDuplicate &&
      activeTab === `focus:${capture.draggableId}`
    setDuplicateBaseId(shouldDuplicate ? capture.draggableId : null)

    if (!shouldDuplicate) {
      setDuplicateDragVisual(null)
      setDuplicateBaseDisplacedDown(false)
      return
    }

    const source = Array.from(
      document.querySelectorAll<HTMLElement>("[data-rfd-draggable-id]")
    ).find(element => element.dataset.rfdDraggableId === capture.draggableId)
    const rect = source?.getBoundingClientRect()
    const sessionRows = source
      ? Array.from(
          source.closest<HTMLElement>("[data-rfd-droppable-id='focus-session-list']")
            ?.querySelectorAll<HTMLElement>("[data-rfd-draggable-id]") ?? []
        )
      : []
    const sourceIndex = source ? sessionRows.indexOf(source) : -1
    const previousRect = sourceIndex > 0
      ? sessionRows[sourceIndex - 1].getBoundingClientRect()
      : null
    const nextRect = sourceIndex !== -1 && sourceIndex < sessionRows.length - 1
      ? sessionRows[sourceIndex + 1].getBoundingClientRect()
      : null
    const rowStep = rect
      ? nextRect
        ? nextRect.top - rect.top
        : previousRect
          ? rect.top - previousRect.top
          : rect.height + 4
      : 0
    setDuplicateDragVisual(rect
      ? {
          sessionId: capture.draggableId,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          rowStep,
        }
      : null)
    setDuplicateBaseDisplacedDown(false)
  }

  const handleDragUpdate = (update: DragUpdate) => {
    if (!duplicateDragRef.current) return
    setDuplicateBaseDisplacedDown(
      Boolean(update.destination && update.destination.index < update.source.index)
    )
  }

  const handleDragEnd = (result: DropResult) => {
    const shouldDuplicate = duplicateDragRef.current
    const shouldSelectDuplicate = duplicateSourceWasSelectedRef.current
    duplicateDragRef.current = false
    duplicateSourceWasSelectedRef.current = false
    setDuplicateBaseId(null)
    setDuplicateDragVisual(null)
    setDuplicateBaseDisplacedDown(false)
    if (!result.destination) return
    if (shouldDuplicate) {
      const duplicatedSessionId = duplicateSession(
        result.source.index,
        result.destination.index
      )
      if (duplicatedSessionId && shouldSelectDuplicate) {
        switchSession(duplicatedSessionId, projects)
        onTabChange(`focus:${duplicatedSessionId}`)
      }
    } else {
      reorderSessions(result.source.index, result.destination.index)
    }
  }

  if (sessions.length === 0) return null

  const duplicateSourceIndex = duplicateBaseId
    ? sortedSessions.findIndex(session => session.id === duplicateBaseId)
    : -1
  const stationarySession = duplicateDragVisual
    ? sortedSessions.find(session => session.id === duplicateDragVisual.sessionId)
    : undefined

  return (
    <>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between pl-4 pr-2">
          <span className="text-xs font-medium text-muted-foreground/60">Sessions</span>
          <button
            onClick={() => onTabChange(`focus:${createBrowseSession()}`)}
            aria-label="New session"
            className={cn(
              "grid h-6 w-6 place-items-center rounded-md text-muted-foreground/50 transition-colors duration-200",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <DragDropContext
          enableDefaultSensors={false}
          sensors={focusSessionSensors}
          onBeforeCapture={handleBeforeCapture}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
        >
          <Droppable droppableId="focus-session-list">
            {provided => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-1"
              >
                {sortedSessions.map((session, index) => {
                  const isDuplicateSource = session.id === duplicateBaseId
                  const dragIndex = duplicateSourceIndex !== -1 && index > duplicateSourceIndex
                    ? index + 1
                    : index

                  return (
                    <Fragment key={session.id}>
                      <SessionRow
                        session={session}
                        index={dragIndex}
                        active={activeTab === `focus:${session.id}`}
                        isDuplicateDragging={isDuplicateSource}
                        onOpen={() => {
                          switchSession(session.id, projects)
                          onTabChange(`focus:${session.id}`)
                        }}
                        onClose={() => {
                          const wasActive = activeTab === `focus:${session.id}`
                          const nextSessionId = removeSession(session.id, projects)
                          if (wasActive) {
                            onTabChange(nextSessionId ? `focus:${nextSessionId}` : 'tasks')
                          }
                        }}
                      />
                      {isDuplicateSource && (
                        <CopyBaseSessionRow
                          sessionId={session.id}
                          index={index + 1}
                        />
                      )}
                    </Fragment>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      {duplicateDragVisual && stationarySession && (
        <StationarySessionRow
          session={stationarySession}
          active={activeTab === `focus:${stationarySession.id}`}
          origin={duplicateDragVisual}
          displacedDown={duplicateBaseDisplacedDown}
        />
      )}
    </>
  )
}
