import type { FocusSession, ProjectData, TaskData } from '@/lib/types'

const localStorageValues = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => localStorageValues.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageValues.set(key, value),
    removeItem: (key: string) => localStorageValues.delete(key),
    clear: () => localStorageValues.clear(),
  },
})

jest.mock('@/lib/sync-bridge', () => ({
  trackFocusSessionCreated: jest.fn(),
  trackFocusSessionDeleted: jest.fn(),
  trackFocusSessionUpdated: jest.fn(),
}))

// Helper to create test tasks
function createTask(id: string, name: string, priority: number, subtasks: TaskData[] = []): TaskData {
  return {
    id,
    name,
    priority,
    position: 0,
    completed: false,
    lastModificationDate: new Date().toISOString(),
    subtasks
  }
}

// Helper to create test project
function createTestProject(tasks: TaskData[]): ProjectData[] {
  return [{
    id: 'project1',
    name: 'Test Project',
    lastModificationDate: new Date().toISOString(),
    tasks
  }]
}

function createFocusSession(id: string, position: number, createdAt: number): FocusSession {
  return {
    id,
    name: id,
    startPath: ['project1'],
    browsePath: ['project1'],
    view: 'focus',
    currentFocusTaskId: null,
    completedCount: 0,
    notes: '',
    createdAt,
    updatedAt: new Date(createdAt).toISOString(),
    position,
    pending: false,
    pendingReason: "",
    remindAt: null,
    reminderFired: false,
  }
}

// Mock useAppStore
jest.mock('./app-store', () => ({
  useAppStore: {
    getState: jest.fn(() => ({
      projects: []
    }))
  }
}))

const { getSessionAnchorTask, useFocusStore } = require('./focus-store') as typeof import('./focus-store')
const { trackFocusSessionUpdated } = require('@/lib/sync-bridge') as typeof import('@/lib/sync-bridge')

function createNotesSession(overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: 'session1',
    name: 'Test session',
    startPath: ['project1'],
    browsePath: ['project1'],
    view: 'browse',
    currentFocusTaskId: null,
    completedCount: 0,
    notes: '',
    createdAt: Date.parse('2026-01-01T00:00:00.000Z'),
    updatedAt: '2026-01-01T00:00:00.000Z',
    position: 0,
    pending: false,
    pendingReason: "",
    remindAt: null,
    reminderFired: false,
    ...overrides,
  }
}

describe('Focus Store - Hierarchical Priority', () => {
  beforeEach(() => {
    // Reset store state
    useFocusStore.setState({
      focusModeProjectLeaves: [],
      currentFocusTask: null,
      currentFocusTaskPath: null,
      focusStartPath: [],
      showAddTasksView: false,
      showSubtaskCelebration: false,
      lastFocusedTaskId: null,
    })
  })

  test('1. Preferred parent beats normal parent', () => {
    const normalChild = createTask('normalChild1', 'Normal Child 1', 0)
    const preferredChild = createTask('preferredChild1', 'Preferred Child 1', 1)
    
    const preferredParent = createTask('preferredParent', 'Preferred Parent', 1, [preferredChild])
    const normalParent = createTask('normalParent', 'Normal Parent', 0, [normalChild])
    
    const projects = createTestProject([preferredParent, normalParent])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })
    
    // Set up focus store state
    useFocusStore.setState({
      focusStartPath: ['project1'],
      focusModeProjectLeaves: [preferredChild, normalChild],
      currentFocusTask: null
    })
    
    // Test multiple selections to verify preferred parent tasks come first
    const selections: string[] = []
    for (let i = 0; i < 10; i++) {
      useFocusStore.getState().getNextFocusTask()
      const currentTask = useFocusStore.getState().currentFocusTask
      if (currentTask) selections.push(currentTask.id)
      
      // Reset current task for next selection
      useFocusStore.setState({ currentFocusTask: null })
    }
    
    // Should only select from preferred parent's children
    expect(selections.every(id => id === 'preferredChild1')).toBe(true)
  })

  test('2. Normal parent beats deferred parent', () => {
    const normalChild = createTask('normalChild2', 'Normal Child 2', 0)
    const deferredChild = createTask('deferredChild2', 'Deferred Child 2', -1)
    
    const normalParent = createTask('normalParent2', 'Normal Parent 2', 0, [normalChild])
    const deferredParent = createTask('deferredParent2', 'Deferred Parent 2', -1, [deferredChild])
    
    const projects = createTestProject([normalParent, deferredParent])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })
    
    useFocusStore.setState({
      focusStartPath: ['project1'],
      focusModeProjectLeaves: [normalChild, deferredChild],
      currentFocusTask: null
    })
    
    const selections: string[] = []
    for (let i = 0; i < 10; i++) {
      useFocusStore.getState().getNextFocusTask()
      const currentTask = useFocusStore.getState().currentFocusTask
      if (currentTask) selections.push(currentTask.id)
      useFocusStore.setState({ currentFocusTask: null })
    }
    
    expect(selections.every(id => id === 'normalChild2')).toBe(true)
  })

  test('3. Preferred child of deferred parent vs normal child of normal parent', () => {
    const normalChild = createTask('normalChild3', 'Normal Child 3', 0)
    const preferredChildOfDeferred = createTask('preferredChild3', 'Preferred Child 3', 1)
    
    const normalParent = createTask('normalParent3', 'Normal Parent 3', 0, [normalChild])
    const deferredParent = createTask('deferredParent3', 'Deferred Parent 3', -1, [preferredChildOfDeferred])
    
    const projects = createTestProject([normalParent, deferredParent])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })
    
    useFocusStore.setState({
      focusStartPath: ['project1'],
      focusModeProjectLeaves: [normalChild, preferredChildOfDeferred],
      currentFocusTask: null
    })
    
    const selections: string[] = []
    for (let i = 0; i < 10; i++) {
      useFocusStore.getState().getNextFocusTask()
      const currentTask = useFocusStore.getState().currentFocusTask
      if (currentTask) selections.push(currentTask.id)
      useFocusStore.setState({ currentFocusTask: null })
    }
    
    // Normal parent's child should beat deferred parent's child
    expect(selections.every(id => id === 'normalChild3')).toBe(true)
  })

  test('4. Same parent, preferred child beats normal child', () => {
    const preferredChild = createTask('preferredChild4', 'Preferred Child 4', 1)
    const normalChild = createTask('normalChild4', 'Normal Child 4', 0)
    
    const parent = createTask('parent4', 'Parent 4', 0, [preferredChild, normalChild])
    
    const projects = createTestProject([parent])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })
    
    useFocusStore.setState({
      focusStartPath: ['project1'],
      focusModeProjectLeaves: [preferredChild, normalChild],
      currentFocusTask: null
    })
    
    const selections: string[] = []
    for (let i = 0; i < 10; i++) {
      useFocusStore.getState().getNextFocusTask()
      const currentTask = useFocusStore.getState().currentFocusTask
      if (currentTask) selections.push(currentTask.id)
      useFocusStore.setState({ currentFocusTask: null })
    }
    
    expect(selections.every(id => id === 'preferredChild4')).toBe(true)
  })

  test('5. Same parent, normal child beats deferred child', () => {
    const normalChild = createTask('normalChild5', 'Normal Child 5', 0)
    const deferredChild = createTask('deferredChild5', 'Deferred Child 5', -1)
    
    const parent = createTask('parent5', 'Parent 5', 0, [normalChild, deferredChild])
    
    const projects = createTestProject([parent])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })
    
    useFocusStore.setState({
      focusStartPath: ['project1'],
      focusModeProjectLeaves: [normalChild, deferredChild],
      currentFocusTask: null
    })
    
    const selections: string[] = []
    for (let i = 0; i < 10; i++) {
      useFocusStore.getState().getNextFocusTask()
      const currentTask = useFocusStore.getState().currentFocusTask
      if (currentTask) selections.push(currentTask.id)
      useFocusStore.setState({ currentFocusTask: null })
    }
    
    expect(selections.every(id => id === 'normalChild5')).toBe(true)
  })

  test('6. Three-level hierarchy: [1,0,-1] beats [0,1,1]', () => {
    // [1,0,-1] - preferred -> normal -> deferred
    const deferredGrandchild1 = createTask('deferredGrandchild1', 'Deferred Grandchild 1', -1)
    const normalChild1 = createTask('normalChild1', 'Normal Child 1', 0, [deferredGrandchild1])
    const preferredParent1 = createTask('preferredParent1', 'Preferred Parent 1', 1, [normalChild1])
    
    // [0,1,1] - normal -> preferred -> preferred  
    const preferredGrandchild2 = createTask('preferredGrandchild2', 'Preferred Grandchild 2', 1)
    const preferredChild2 = createTask('preferredChild2', 'Preferred Child 2', 1, [preferredGrandchild2])
    const normalParent2 = createTask('normalParent2', 'Normal Parent 2', 0, [preferredChild2])
    
    const projects = createTestProject([preferredParent1, normalParent2])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })
    
    useFocusStore.setState({
      focusStartPath: ['project1'],
      focusModeProjectLeaves: [deferredGrandchild1, preferredGrandchild2],
      currentFocusTask: null
    })
    
    const selections: string[] = []
    for (let i = 0; i < 10; i++) {
      useFocusStore.getState().getNextFocusTask()
      const currentTask = useFocusStore.getState().currentFocusTask
      if (currentTask) selections.push(currentTask.id)
      useFocusStore.setState({ currentFocusTask: null })
    }
    
    // [1,0,-1] should beat [0,1,1]
    expect(selections.every(id => id === 'deferredGrandchild1')).toBe(true)
  })

  test('7. Deep preferred chain vs shallow normal: [1,1,1,1] beats [0,1]', () => {
    // [1,1,1,1] - deep preferred chain
    const deepLeaf = createTask('deepLeaf', 'Deep Leaf', 1)
    const level3 = createTask('level3', 'Level 3', 1, [deepLeaf])
    const level2 = createTask('level2', 'Level 2', 1, [level3])
    const level1 = createTask('level1', 'Level 1', 1, [level2])
    
    // [0,1] - shallow normal chain
    const shallowLeaf = createTask('shallowLeaf', 'Shallow Leaf', 1)
    const normalParent = createTask('normalParent', 'Normal Parent', 0, [shallowLeaf])
    
    const projects = createTestProject([level1, normalParent])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })
    
    useFocusStore.setState({
      focusStartPath: ['project1'],
      focusModeProjectLeaves: [deepLeaf, shallowLeaf],
      currentFocusTask: null
    })
    
    const selections: string[] = []
    for (let i = 0; i < 10; i++) {
      useFocusStore.getState().getNextFocusTask()
      const currentTask = useFocusStore.getState().currentFocusTask
      if (currentTask) selections.push(currentTask.id)
      useFocusStore.setState({ currentFocusTask: null })
    }
    
    // Deep preferred should beat shallow normal
    expect(selections.every(id => id === 'deepLeaf')).toBe(true)
  })

  test('11. Empty priority array - focus on leaf task itself', () => {
    const leafTask = createTask('leafTask', 'Leaf Task', 1)
    const projects = createTestProject([leafTask])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })
    
    // Focus directly on the leaf task
    useFocusStore.setState({
      focusStartPath: ['project1', 'leafTask'],
      focusModeProjectLeaves: [leafTask], // Task is its own leaf
      currentFocusTask: null
    })
    
    useFocusStore.getState().getNextFocusTask()
    const selectedTask = useFocusStore.getState().currentFocusTask
    
    // Should handle empty priority array gracefully
    expect(selectedTask?.id).toBe('leafTask')
    expect(useFocusStore.getState().currentFocusTaskPath).toEqual(['project1', 'leafTask'])
  })

  test('stores the selected task path while traversing the focus tree once', () => {
    const leaf = createTask('leaf', 'Leaf', 0)
    const parent = createTask('parent', 'Parent', 1, [leaf])
    const projects = createTestProject([parent])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })

    useFocusStore.setState({
      focusStartPath: ['project1'],
      focusModeProjectLeaves: [leaf],
      currentFocusTask: null,
      currentFocusTaskPath: null,
    })

    useFocusStore.getState().getNextFocusTask()

    expect(useFocusStore.getState().currentFocusTask?.id).toBe('leaf')
    expect(useFocusStore.getState().currentFocusTaskPath).toEqual([
      'project1',
      'parent',
      'leaf',
    ])
  })

  test('uses the stored current path when add-tasks view creates a new subtask', () => {
    const child = createTask('child', 'Child', 0)
    const parent = createTask('parent', 'Parent', 0, [child])
    const projects = createTestProject([parent])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })

    useFocusStore.setState({
      focusStartPath: ['project1'],
      focusModeProjectLeaves: [parent],
      currentFocusTask: parent,
      currentFocusTaskPath: ['project1', 'parent'],
      showAddTasksView: true,
    })

    useFocusStore.getState().setShowAddTasksView(false)

    expect(useFocusStore.getState().focusStartPath).toEqual(['project1', 'parent'])
    expect(useFocusStore.getState().currentFocusTask?.id).toBe('child')
    expect(useFocusStore.getState().currentFocusTaskPath).toEqual([
      'project1',
      'parent',
      'child',
    ])
  })

  test('12. Complex scenario - Mixed hierarchy depths and priorities', () => {
    // Structure from the specification
    const normalChild = createTask('normalChild', 'Normal Child', 0)
    const deferredChild = createTask('deferredChild', 'Deferred Child', -1)
    const preferredParent = createTask('preferredParent', 'Preferred Parent', 1, [normalChild, deferredChild])
    
    const preferredChild = createTask('preferredChild', 'Preferred Child', 1)
    const preferredGrandchild = createTask('preferredGrandchild', 'Preferred Grandchild', 1)
    const normalGrandparent = createTask('normalGrandparent', 'Normal Grandparent', 0, [preferredGrandchild])
    const normalParent = createTask('normalParent', 'Normal Parent', 0, [preferredChild, normalGrandparent])
    
    const preferredChildOfDeferred = createTask('preferredChildOfDeferred', 'Preferred Child Of Deferred', 1)
    const deferredParent = createTask('deferredParent', 'Deferred Parent', -1, [preferredChildOfDeferred])
    
    const projects = createTestProject([preferredParent, normalParent, deferredParent])
    const mockUseAppStore = require('./app-store').useAppStore
    mockUseAppStore.getState.mockReturnValue({ projects })
    
    const allLeaves = [normalChild, deferredChild, preferredChild, preferredGrandchild, preferredChildOfDeferred]
    
    useFocusStore.setState({
      focusStartPath: ['project1'],
      focusModeProjectLeaves: allLeaves,
      currentFocusTask: null
    })
    
    // Test the key comparison: [1,-1] beats [0,1]
    const selections: string[] = []
    for (let i = 0; i < 10; i++) {
      useFocusStore.getState().getNextFocusTask()
      const currentTask = useFocusStore.getState().currentFocusTask
      if (currentTask) selections.push(currentTask.id)
      // Don't reset currentFocusTask - let it exclude previous selections naturally
    }
    
    
    // Expected behavior:
    // 1st selection: normalChild [1,0] (highest priority)
    // 2nd selection: deferredChild [1,-1] (only remaining task from preferred parent)
    // Then alternates between them since both are from preferred parent
    
    // Should only select from preferred parent's children
    const preferredParentTasks = ['normalChild', 'deferredChild']
    expect(selections.every(id => preferredParentTasks.includes(id))).toBe(true)
    
    // Both tasks should appear since they alternate when current task is excluded
    expect(selections.includes('normalChild')).toBe(true)
    expect(selections.includes('deferredChild')).toBe(true)
    
    // Verify hierarchical priority: preferred parent children beat normal parent children
    const normalParentTasks = ['preferredChild', 'preferredGrandchild']
    const selectedFromNormal = selections.some(id => normalParentTasks.includes(id))
    expect(selectedFromNormal).toBe(false) // Should never select from normal parent
  })
})

describe('Focus Store - Session Notes', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-07-18T12:00:00.000Z'))
    localStorage.clear()
    jest.clearAllMocks()
    useFocusStore.setState({ sessions: [], activeSessionId: null })
  })

  afterEach(() => {
    for (const session of useFocusStore.getState().sessions) {
      useFocusStore.getState().flushSessionNotesSync(session.id)
    }
    jest.useRealTimers()
  })

  test('rehydration defaults missing notes to an empty string', async () => {
    const { notes: _notes, ...sessionWithoutNotes } = createNotesSession()
    localStorage.setItem('focus-sessions', JSON.stringify({
      state: { sessions: [sessionWithoutNotes], activeSessionId: sessionWithoutNotes.id },
      version: 0,
    }))

    await useFocusStore.persist.rehydrate()

    expect(useFocusStore.getState().sessions[0].notes).toBe('')
  })

  test('setSessionNotes updates notes and updatedAt immediately', () => {
    useFocusStore.setState({ sessions: [createNotesSession()] })

    useFocusStore.getState().setSessionNotes('session1', 'A useful thought')

    const session = useFocusStore.getState().sessions[0]
    expect(session.notes).toBe('A useful thought')
    expect(session.updatedAt).toBe('2026-07-18T12:00:00.000Z')
    expect(trackFocusSessionUpdated).not.toHaveBeenCalled()
  })

  test('debounces rapid notes changes into one sync update', () => {
    useFocusStore.setState({ sessions: [createNotesSession()] })

    useFocusStore.getState().setSessionNotes('session1', 'First')
    jest.advanceTimersByTime(400)
    useFocusStore.getState().setSessionNotes('session1', 'Second')
    jest.advanceTimersByTime(400)
    useFocusStore.getState().setSessionNotes('session1', 'Final')

    expect(trackFocusSessionUpdated).not.toHaveBeenCalled()
    jest.advanceTimersByTime(800)

    expect(trackFocusSessionUpdated).toHaveBeenCalledTimes(1)
    expect(trackFocusSessionUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'session1', notes: 'Final' })
    )
  })

  test('flushSessionNotesSync tracks pending notes once without a later duplicate', () => {
    useFocusStore.setState({ sessions: [createNotesSession()] })
    useFocusStore.getState().setSessionNotes('session1', 'Flush me')

    useFocusStore.getState().flushSessionNotesSync('session1')

    expect(trackFocusSessionUpdated).toHaveBeenCalledTimes(1)
    expect(trackFocusSessionUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'session1', notes: 'Flush me' })
    )

    jest.advanceTimersByTime(800)
    useFocusStore.getState().flushSessionNotesSync('session1')
    expect(trackFocusSessionUpdated).toHaveBeenCalledTimes(1)
  })
})

describe('Focus Store - Session Reordering', () => {
  beforeEach(() => {
    useFocusStore.setState({ sessions: [], activeSessionId: null })
  })

  test('reorders from visual position and persists gap-free positions', () => {
    const first = createFocusSession('first', 0, 1000)
    const second = createFocusSession('second', 1, 2000)
    const third = createFocusSession('third', 2, 3000)

    // Keep state deliberately out of array order to verify the visual position contract.
    useFocusStore.setState({ sessions: [third, first, second], activeSessionId: 'first' })

    useFocusStore.getState().reorderSessions(0, 2)

    const state = useFocusStore.getState()
    expect(state.sessions.map(session => session.id)).toEqual(['second', 'third', 'first'])
    expect(state.sessions.map(session => session.position)).toEqual([0, 1, 2])
    expect(state.activeSessionId).toBe('first')
  })

  test('opens a newly created focus session in the docked view by default', () => {
    const task = createTask('task1', 'Task 1', 0)
    const projects = createTestProject([task])

    const sessionId = useFocusStore.getState().createSession(
      projects,
      ['project1', 'task1'],
    )

    expect(useFocusStore.getState().sessions.find(session => session.id === sessionId)).toMatchObject({
      startPath: ['project1', 'task1'],
      view: 'docked',
    })
  })

  test('creates a browse session at the bottom and makes it active', () => {
    const task = createTask('task1', 'Task 1', 0)
    const projects = createTestProject([task])
    const first = createFocusSession('first', 2, 1000)
    const second = createFocusSession('second', 5, 2000)
    useFocusStore.setState({ sessions: [second, first], activeSessionId: 'first' })

    const sessionId = useFocusStore.getState().createSession(
      projects,
      ['project1', 'task1'],
      'browse',
    )

    const state = useFocusStore.getState()
    const created = state.sessions.find(session => session.id === sessionId)
    expect(created).toMatchObject({
      name: 'Task 1',
      startPath: ['project1', 'task1'],
      browsePath: ['project1', 'task1'],
      view: 'browse',
      position: 6,
    })
    expect(state.activeSessionId).toBe(sessionId)
  })

  test('selects the session immediately above an active session that is removed', () => {
    const projects = createTestProject([])
    const first = createFocusSession('first', 0, 1000)
    const second = createFocusSession('second', 1, 2000)
    const third = createFocusSession('third', 2, 3000)

    // Keep array order different from visual order to exercise position-based selection.
    useFocusStore.setState({ sessions: [third, first, second], activeSessionId: 'third' })

    const selectedId = useFocusStore.getState().removeSession('third', projects)

    const state = useFocusStore.getState()
    expect(selectedId).toBe('second')
    expect(state.activeSessionId).toBe('second')
    expect(state.sessions.map(session => session.id)).toEqual(['first', 'second'])
  })

  test('selects the session below when the removed active session has none above', () => {
    const projects = createTestProject([])
    const first = createFocusSession('first', 0, 1000)
    const second = createFocusSession('second', 1, 2000)
    useFocusStore.setState({ sessions: [first, second], activeSessionId: 'first' })

    const selectedId = useFocusStore.getState().removeSession('first', projects)

    expect(selectedId).toBe('second')
    expect(useFocusStore.getState().activeSessionId).toBe('second')
  })

  test('duplicates at the visual drop position without moving the source', () => {
    const first = {
      ...createFocusSession('first', 0, 1000),
      browsePath: ['project1', 'task1'],
      view: 'browse' as const,
      currentFocusTaskId: 'task1',
      completedCount: 4,
      pending: true,
      pendingReason: "code review",
      remindAt: Date.now() + 60_000,
      reminderFired: true,
    }
    const second = createFocusSession('second', 1, 2000)
    const third = createFocusSession('third', 2, 3000)
    useFocusStore.setState({ sessions: [first, second, third], activeSessionId: 'first' })

    const duplicatedId = useFocusStore.getState().duplicateSession(0, 2)

    const state = useFocusStore.getState()
    expect(state.sessions.map(session => session.id)).toEqual(['first', 'second', duplicatedId, 'third'])
    expect(state.sessions.map(session => session.position)).toEqual([0, 1, 2, 3])
    expect(state.activeSessionId).toBe('first')

    const duplicated = state.sessions[2]
    expect(duplicated).toMatchObject({
      name: first.name,
      startPath: first.startPath,
      browsePath: first.browsePath,
      view: first.view,
      currentFocusTaskId: first.currentFocusTaskId,
      completedCount: first.completedCount,
      pending: false,
      pendingReason: "",
      remindAt: null,
      reminderFired: false,
    })
    expect(duplicated.id).not.toBe(first.id)
  })
})

describe('Focus Store - Session Zoom', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useFocusStore.setState({
      sessions: [],
      activeSessionId: null,
      currentFocusTask: null,
      currentFocusTaskPath: null,
    })
  })

  test('steps focus to docked to browse and saves the current task anchor', () => {
    const currentTask = createTask('current-task', 'Current task', 0)
    useFocusStore.setState({
      sessions: [createFocusSession('session1', 0, 1)],
      activeSessionId: 'session1',
      currentFocusTask: currentTask,
      currentFocusTaskPath: ['project1', 'current-task'],
    })

    useFocusStore.getState().zoomSessionOut('session1')

    expect(useFocusStore.getState().sessions[0]).toMatchObject({
      view: 'docked',
      currentFocusTaskId: 'current-task',
    })
    expect(trackFocusSessionUpdated).toHaveBeenNthCalledWith(1, expect.objectContaining({
      view: 'focus',
      currentFocusTaskId: 'current-task',
    }))
    expect(trackFocusSessionUpdated).toHaveBeenNthCalledWith(2, expect.objectContaining({
      view: 'docked',
      currentFocusTaskId: 'current-task',
    }))

    useFocusStore.getState().zoomSessionOut('session1')
    expect(useFocusStore.getState().sessions[0].view).toBe('browse')

    const browseSession = useFocusStore.getState().sessions[0]
    useFocusStore.getState().zoomSessionOut('session1')
    expect(useFocusStore.getState().sessions[0]).toBe(browseSession)
    expect(trackFocusSessionUpdated).toHaveBeenCalledTimes(3)
  })

  test('opens a scope selected while browsing in the docked view', () => {
    const task = createTask('task1', 'Task 1', 0)
    const projects = createTestProject([task])
    useFocusStore.setState({
      sessions: [{
        ...createFocusSession('session1', 0, 1),
        startPath: [],
        browsePath: [],
        view: 'browse',
      }],
      activeSessionId: 'session1',
    })

    useFocusStore.getState().setSessionScope('session1', projects, ['project1', 'task1'])

    expect(useFocusStore.getState().sessions[0]).toMatchObject({
      startPath: ['project1', 'task1'],
      browsePath: ['project1', 'task1'],
      view: 'docked',
    })
  })
})

describe('Focus Store - Session Anchor Selector', () => {
  test('resolves a live nested task and its full path within the session project', () => {
    const anchor = createTask('anchor', 'Anchor task', 0)
    const parent = createTask('parent', 'Parent task', 0, [anchor])
    const projects = createTestProject([parent])
    useFocusStore.setState({
      sessions: [{
        ...createFocusSession('session1', 0, 1),
        currentFocusTaskId: 'anchor',
      }],
    })

    expect(getSessionAnchorTask(useFocusStore.getState(), projects, 'session1')).toEqual({
      task: anchor,
      fullPath: ['project1', 'parent', 'anchor'],
    })
  })

  test('returns null when the anchor task is completed or missing', () => {
    const completedAnchor = { ...createTask('anchor', 'Anchor task', 0), completed: true }
    const projects = createTestProject([completedAnchor])
    useFocusStore.setState({
      sessions: [{
        ...createFocusSession('session1', 0, 1),
        currentFocusTaskId: 'anchor',
      }],
    })

    expect(getSessionAnchorTask(useFocusStore.getState(), projects, 'session1')).toBeNull()

    useFocusStore.setState({
      sessions: [{
        ...createFocusSession('session1', 0, 1),
        currentFocusTaskId: 'missing',
      }],
    })
    expect(getSessionAnchorTask(useFocusStore.getState(), projects, 'session1')).toBeNull()
  })
})
