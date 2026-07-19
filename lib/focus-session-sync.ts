import type { FocusSession, FocusSessionSyncField } from './types'

export const focusSessionSyncFields = [
  'name',
  'startPath',
  'browsePath',
  'view',
  'currentFocusTaskId',
  'completedCount',
  'notes',
  'position',
  'pending',
  'pendingReason',
  'remindAt',
  'reminderFired',
] as const satisfies readonly FocusSessionSyncField[]

export function nextFocusSessionUpdatedAt(previous: string, now = Date.now()): string {
  const previousTime = Date.parse(previous)
  const nextTime = Number.isFinite(previousTime) ? Math.max(now, previousTime + 1) : now
  return new Date(nextTime).toISOString()
}

export function getChangedFocusSessionFields(
  previous: FocusSession,
  next: FocusSession,
): FocusSessionSyncField[] {
  return focusSessionSyncFields.filter(field => previous[field] !== next[field])
}

export function shouldKeepLocalFocusSession(
  localUpdatedAt: string,
  cloudUpdatedAt: string,
  hasPendingChanges: boolean,
): boolean {
  return hasPendingChanges || localUpdatedAt > cloudUpdatedAt
}

export function buildFocusSessionUpdate(
  session: FocusSession,
  fields: FocusSessionSyncField[],
  deviceId: string,
): Record<string, unknown> {
  const update: Record<string, unknown> = {
    updated_at: session.updatedAt,
    device_id: deviceId,
    is_deleted: false,
  }

  for (const field of fields) {
    switch (field) {
      case 'name': update.name = session.name; break
      case 'startPath': update.start_path = session.startPath; break
      case 'browsePath': update.browse_path = session.browsePath; break
      case 'view': update.view = session.view; break
      case 'currentFocusTaskId': update.current_focus_task_id = session.currentFocusTaskId; break
      case 'completedCount': update.completed_count = session.completedCount; break
      case 'notes': update.notes = session.notes ?? ''; break
      case 'position': update.position = session.position; break
      case 'pending': update.pending = session.pending ?? false; break
      case 'pendingReason': update.pending_reason = session.pendingReason ?? ''; break
      case 'remindAt': update.remind_at = session.remindAt ?? null; break
      case 'reminderFired': update.reminder_fired = session.reminderFired ?? false; break
    }
  }

  return update
}
