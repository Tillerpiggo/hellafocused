import type { FocusSession } from '@/lib/types'
import type { SyncAction } from '@/lib/sync-types'
import { useSyncStore } from './sync-store'

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
    createdAt: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
    position: 0,
    ...overrides,
  }
}

function createUpdate(overrides: Partial<SyncAction> = {}): SyncAction {
  return {
    type: 'update',
    entityType: 'focus_session',
    entityId: 'session-1',
    userId: '',
    timestamp: 100,
    data: createSession(),
    synced: false,
    retryCount: 0,
    ...overrides,
  }
}

describe('Sync Store - focus-session updates', () => {
  beforeEach(() => {
    useSyncStore.setState({
      pendingChanges: {},
      currentUserId: 'user-1',
    })
  })

  test('merges same-millisecond field updates without losing either field', () => {
    const firstId = useSyncStore.getState().addPendingChange(createUpdate({
      focusSessionFields: ['notes'],
      data: createSession({ notes: 'Remember this' }),
    }))
    const secondId = useSyncStore.getState().addPendingChange(createUpdate({
      focusSessionFields: ['view'],
      data: createSession({ notes: 'Remember this', view: 'browse' }),
    }))

    expect(secondId).toBe(firstId)
    expect(useSyncStore.getState().pendingChanges[firstId!].focusSessionFields)
      .toEqual(['notes', 'view'])
  })

  test('keeps legacy whole-row intent when merging a pre-field-list action', () => {
    const id = useSyncStore.getState().addPendingChange(createUpdate())
    useSyncStore.getState().addPendingChange(createUpdate({
      timestamp: 101,
      focusSessionFields: ['notes'],
      data: createSession({ notes: 'New note' }),
    }))

    expect(useSyncStore.getState().pendingChanges[id!].focusSessionFields).toBeUndefined()
  })
})
