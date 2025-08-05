import { useFocusStore } from './focus-store'
import type { ProjectData, TaskData } from '@/lib/types'

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

// Mock useAppStore
jest.mock('./app-store', () => ({
  useAppStore: {
    getState: jest.fn(() => ({
      projects: []
    }))
  }
}))

describe('Focus Store - Hierarchical Priority', () => {
  beforeEach(() => {
    // Reset store state
    useFocusStore.setState({
      focusModeProjectLeaves: [],
      currentFocusTask: null,
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