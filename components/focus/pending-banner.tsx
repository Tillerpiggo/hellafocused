"use client"
import { useEffect, useState } from "react"
import { Hourglass, Check } from "lucide-react"
import { useFocusStore } from "@/store/focus-store"
import { useReminderTick } from "@/hooks/use-reminder-tick"
import { PendingPicker } from "./pending-picker"
import { cn } from "@/lib/utils"

// Resolution point for a pending session: shows the reason, the reminder
// countdown, and the only two ways out — re-snooze or resolve.
export function PendingBanner({ sessionId }: { sessionId: string }) {
  const session = useFocusStore(s => s.sessions.find(ss => ss.id === sessionId))
  const markPending = useFocusStore(s => s.markPending)
  const resolvePending = useFocusStore(s => s.resolvePending)
  const setPendingReason = useFocusStore(s => s.setPendingReason)
  const reminderDisplay = useReminderTick(sessionId)

  const reason = session?.pendingReason ?? ""
  const [draftReason, setDraftReason] = useState(reason)
  useEffect(() => setDraftReason(reason), [reason])

  if (!session?.pending) return null
  const fired = session.reminderFired ?? false

  const commitReason = () => {
    if (draftReason.trim() !== reason) setPendingReason(sessionId, draftReason)
  }

  return (
    <div className="absolute top-7 left-1/2 -translate-x-1/2 z-10 max-w-[min(90vw,28rem)]">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-sm transition-colors duration-300",
          fired
            ? "border-primary/30 bg-primary/10"
            : "border-foreground/10 bg-foreground/[0.03] text-muted-foreground"
        )}
      >
        {fired ? (
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
        ) : (
          <Hourglass className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
        )}

        <span className={cn("flex-shrink-0 text-xs font-medium", fired && "text-primary")}>
          {fired ? "Check:" : "Waiting on"}
        </span>

        <input
          value={draftReason}
          onChange={e => setDraftReason(e.target.value)}
          onBlur={commitReason}
          onKeyDown={e => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur()
            if (e.key === "Escape") {
              setDraftReason(reason)
              ;(e.target as HTMLInputElement).blur()
            }
            e.stopPropagation()
          }}
          placeholder="what are you waiting on?"
          className={cn(
            "min-w-0 w-44 bg-transparent text-sm outline-none placeholder:italic placeholder:text-muted-foreground/50",
            fired ? "text-foreground" : "text-foreground/80"
          )}
        />

        {!fired && reminderDisplay && (
          <PendingPicker
            isPending
            remindAt={session.remindAt}
            onMarkPending={ms => markPending(sessionId, ms)}
            onResolve={() => resolvePending(sessionId)}
          >
            <button className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums text-muted-foreground hover:bg-foreground/5 transition-colors">
              {reminderDisplay.label}
            </button>
          </PendingPicker>
        )}
        {!fired && !reminderDisplay && (
          <PendingPicker
            isPending
            remindAt={session.remindAt}
            onMarkPending={ms => markPending(sessionId, ms)}
            onResolve={() => resolvePending(sessionId)}
          >
            <button className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs text-muted-foreground/60 hover:bg-foreground/5 transition-colors">
              remind
            </button>
          </PendingPicker>
        )}

        {fired && (
          <PendingPicker
            isPending
            remindAt={null}
            onMarkPending={ms => markPending(sessionId, ms)}
            onResolve={() => resolvePending(sessionId)}
          >
            <button className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
              Still waiting
            </button>
          </PendingPicker>
        )}

        <button
          onClick={() => resolvePending(sessionId)}
          aria-label="Resolve pending"
          className={cn(
            "flex-shrink-0 grid h-6 w-6 place-items-center rounded-full transition-colors",
            fired
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground/60 hover:bg-foreground/5 hover:text-foreground"
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
