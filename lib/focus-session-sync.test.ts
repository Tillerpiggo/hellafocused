import {
  buildFocusSessionUpdate,
  getChangedFocusSessionFields,
  nextFocusSessionUpdatedAt,
  shouldKeepLocalFocusSession,
} from './focus-session-sync'
import type { FocusSession } from './types'

function createSession(overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: 'session-1',
    name: 'Session',
    startPath: ['project-1'],
    browsePath: ['project-1'],
    view: 'docked',
    currentFocusTaskId: 'task-a',
    completedCount: 0,
    notes: '',
    createdAt: Date.parse('2026-01-01T00:00:00.000Z'),
    updatedAt: '2026-01-01T00:00:00.000Z',
    position: 0,
    pending: false,
    pendingReason: '',
    remindAt: null,
    reminderFired: false,
    ...overrides,
  }
}

describe('focus-session sync', () => {
  test('keeps timestamps monotonic for multiple updates in the same millisecond', () => {
    expect(nextFocusSessionUpdatedAt('2026-01-01T00:00:00.000Z', Date.parse('2026-01-01T00:00:00.000Z')))
      .toBe('2026-01-01T00:00:00.001Z')
  })

  test('identifies only the fields that actually changed', () => {
    const previous = createSession()
    const next = { ...previous, view: 'browse' as const, notes: 'Remember this' }

    expect(getChangedFocusSessionFields(previous, next)).toEqual(['view', 'notes'])
  })

  test('does not include a stale task id in an unrelated notes update', () => {
    const update = buildFocusSessionUpdate(
      createSession({ currentFocusTaskId: 'stale-task', notes: 'Fresh note' }),
      ['notes'],
      'instance-1',
    )

    expect(update).toEqual({
      notes: 'Fresh note',
      updated_at: '2026-01-01T00:00:00.000Z',
      device_id: 'instance-1',
      is_deleted: false,
    })
    expect(update).not.toHaveProperty('current_focus_task_id')
  })

  test('uses the cloud row after an equal-timestamp partial update', () => {
    expect(shouldKeepLocalFocusSession(
      '2026-01-01T00:00:00.001Z',
      '2026-01-01T00:00:00.001Z',
      false,
    )).toBe(false)
    expect(shouldKeepLocalFocusSession(
      '2026-01-01T00:00:00.001Z',
      '2026-01-01T00:00:00.001Z',
      true,
    )).toBe(true)
  })

  test('includes the task id when the focus task itself changes', () => {
    const update = buildFocusSessionUpdate(createSession(), ['currentFocusTaskId'], 'instance-1')
    expect(update.current_focus_task_id).toBe('task-a')
  })
})
