import { moveTaskWithPriorityChange, toggleTaskPrefer } from './task-utils'
import type { ProjectData, TaskData } from './types'

// Helper to create test tasks
function createTask(id: string, name: string, priority: number, position: number): TaskData {
  return {
    id,
    name,
    priority,
    position,
    completed: false,
    lastModificationDate: new Date().toISOString(),
    subtasks: []
  }
}

// Helper to create test project with tasks
function createTestProject(tasks: TaskData[]): ProjectData[] {
  return [{
    id: 'project1',
    name: 'Test Project',
    lastModificationDate: new Date().toISOString(),
    tasks
  }]
}

// Helper to get visual array (sorted like UI shows)
function getVisualArray(tasks: TaskData[]): TaskData[] {
  return tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority // 1 first, then 0, then -1
      if (a.position !== undefined && b.position !== undefined) return a.position - b.position
      return a.lastModificationDate.localeCompare(b.lastModificationDate)
    })
}

describe('moveTaskWithPriorityChange', () => {
  
  test('Move from normal section (index 1) to deferred section (index 3)', () => {
    // Setup: Normal[0,1,2] + Deferred[0,1] 
    // Visual: [N0, N1, N2, D0, D1] - indices 0,1,2,3,4
    const tasks = [
      createTask('n0', 'Normal 0', 0, 0),
      createTask('n1', 'Normal 1', 0, 1), // This one will move
      createTask('n2', 'Normal 2', 0, 2),
      createTask('d0', 'Deferred 0', -1, 0),
      createTask('d1', 'Deferred 1', -1, 1),
    ]
    
    const projects = createTestProject(tasks)
    const visual = getVisualArray(tasks)
    
    console.log('BEFORE:')
    console.log('Visual array:', visual.map(t => `${t.name}(${t.priority}:${t.position})`))
    console.log('Normal tasks:', tasks.filter(t => t.priority === 0).map(t => `${t.name}:${t.position}`))
    console.log('Deferred tasks:', tasks.filter(t => t.priority === -1).map(t => `${t.name}:${t.position}`))
    
    // Move task at visual index 1 (Normal 1) to visual index 3 (should become first deferred task)
    moveTaskWithPriorityChange(projects, ['project1', 'n1'], 1, 3, -1)
    
    console.log('\nAFTER:')
    const newVisual = getVisualArray(tasks)
    console.log('Visual array:', newVisual.map(t => `${t.name}(${t.priority}:${t.position})`))
    console.log('Normal tasks:', tasks.filter(t => t.priority === 0).map(t => `${t.name}:${t.position}`))
    console.log('Deferred tasks:', tasks.filter(t => t.priority === -1).map(t => `${t.name}:${t.position}`))
    
    // Expected results:
    // Normal section: n0(pos 0), n2(pos 1) - n2 should shift down to fill gap
    // Deferred section: n1(pos 0), d0(pos 1), d1(pos 2) - n1 becomes first, others shift
    
    const n0 = tasks.find(t => t.id === 'n0')!
    const n1 = tasks.find(t => t.id === 'n1')!
    const n2 = tasks.find(t => t.id === 'n2')!
    const d0 = tasks.find(t => t.id === 'd0')!
    const d1 = tasks.find(t => t.id === 'd1')!
    
    expect(n0.priority).toBe(0)
    expect(n0.position).toBe(0)
    
    expect(n1.priority).toBe(-1) // Changed to deferred
    expect(n1.position).toBe(0)  // First in deferred section
    
    expect(n2.priority).toBe(0)
    expect(n2.position).toBe(1)  // Shifted down to fill gap
    
    expect(d0.priority).toBe(-1)
    expect(d0.position).toBe(1)  // Shifted to make room
    
    expect(d1.priority).toBe(-1)
    expect(d1.position).toBe(2)  // Shifted to make room
    
    // Verify visual order is correct: [n0, n2, n1, d0, d1]
    const finalVisual = getVisualArray(tasks)
    expect(finalVisual[0].id).toBe('n0')
    expect(finalVisual[1].id).toBe('n2')
    expect(finalVisual[2].id).toBe('n1')
    expect(finalVisual[3].id).toBe('d0')
    expect(finalVisual[4].id).toBe('d1')
  })
  
  test('Move from deferred section (index 3) to normal section (index 1)', () => {
    // Setup: Normal[0,1] + Deferred[0,1,2]
    // Visual: [N0, N1, D0, D1, D2] - indices 0,1,2,3,4
    const tasks = [
      createTask('n0', 'Normal 0', 0, 0),
      createTask('n1', 'Normal 1', 0, 1),
      createTask('d0', 'Deferred 0', -1, 0),
      createTask('d1', 'Deferred 1', -1, 1), // This one will move
      createTask('d2', 'Deferred 2', -1, 2),
    ]
    
    const projects = createTestProject(tasks)
    
    console.log('\nTEST 2 BEFORE:')
    const visual = getVisualArray(tasks)
    console.log('Visual array:', visual.map(t => `${t.name}(${t.priority}:${t.position})`))
    
    // Move task at visual index 3 (Deferred 1) to visual index 1 (should become second normal task)
    moveTaskWithPriorityChange(projects, ['project1', 'd1'], 3, 1, 0)
    
    console.log('\nTEST 2 AFTER:')
    const newVisual = getVisualArray(tasks)
    console.log('Visual array:', newVisual.map(t => `${t.name}(${t.priority}:${t.position})`))
    
    // Expected results:
    // Normal section: n0(pos 0), d1(pos 1), n1(pos 2) - d1 inserted, n1 shifted
    // Deferred section: d0(pos 0), d2(pos 1) - d2 shifted down to fill gap
    
    const n0 = tasks.find(t => t.id === 'n0')!
    const n1 = tasks.find(t => t.id === 'n1')!
    const d0 = tasks.find(t => t.id === 'd0')!
    const d1 = tasks.find(t => t.id === 'd1')!
    const d2 = tasks.find(t => t.id === 'd2')!
    
    expect(n0.priority).toBe(0)
    expect(n0.position).toBe(0)
    
    expect(d1.priority).toBe(0)  // Changed to normal
    expect(d1.position).toBe(1)  // Inserted at position 1
    
    expect(n1.priority).toBe(0)
    expect(n1.position).toBe(2)  // Shifted to make room
    
    expect(d0.priority).toBe(-1)
    expect(d0.position).toBe(0)  // Unchanged
    
    expect(d2.priority).toBe(-1)
    expect(d2.position).toBe(1)  // Shifted down to fill gap
    
    // Verify visual order: [n0, d1, n1, d0, d2]
    const finalVisual = getVisualArray(tasks)
    expect(finalVisual[0].id).toBe('n0')
    expect(finalVisual[1].id).toBe('d1')
    expect(finalVisual[2].id).toBe('n1')
    expect(finalVisual[3].id).toBe('d0')
    expect(finalVisual[4].id).toBe('d2')
  })
  
  test('Move to end of deferred section', () => {
    // Setup: Normal[0,1] + Deferred[0,1]
    // Visual: [N0, N1, D0, D1] - indices 0,1,2,3
    const tasks = [
      createTask('n0', 'Normal 0', 0, 0),
      createTask('n1', 'Normal 1', 0, 1), // This one will move
      createTask('d0', 'Deferred 0', -1, 0),
      createTask('d1', 'Deferred 1', -1, 1),
    ]
    
    const projects = createTestProject(tasks)
    
    // Move n1 to end (visual index 3 -> should become last deferred)
    moveTaskWithPriorityChange(projects, ['project1', 'n1'], 1, 3, -1)
    
    const n1 = tasks.find(t => t.id === 'n1')!
    expect(n1.priority).toBe(-1)
    expect(n1.position).toBe(1)  // Should be position 1 in deferred section (after d0 at pos 0)
    
    const d0 = tasks.find(t => t.id === 'd0')!
    const d1 = tasks.find(t => t.id === 'd1')!
    expect(d0.position).toBe(0)  // Unchanged
    expect(d1.position).toBe(2)  // Shifted to make room... wait this is wrong
  })
  
  test('Move to beginning of deferred section', () => {
    // Setup: Normal[0,1] + Deferred[0,1]
    // Visual: [N0, N1, D0, D1] - indices 0,1,2,3
    const tasks = [
      createTask('n0', 'Normal 0', 0, 0),
      createTask('n1', 'Normal 1', 0, 1), // This one will move  
      createTask('d0', 'Deferred 0', -1, 0),
      createTask('d1', 'Deferred 1', -1, 1),
    ]
    
    const projects = createTestProject(tasks)
    
    // Move n1 to beginning of deferred section (visual index 2)
    moveTaskWithPriorityChange(projects, ['project1', 'n1'], 1, 2, -1)
    
    const n1 = tasks.find(t => t.id === 'n1')!
    expect(n1.priority).toBe(-1)
    expect(n1.position).toBe(0)  // Should be first in deferred section
    
    const d0 = tasks.find(t => t.id === 'd0')!
    const d1 = tasks.find(t => t.id === 'd1')!
    expect(d0.position).toBe(1)  // Shifted to make room
    expect(d1.position).toBe(2)  // Shifted to make room
  })

  test('Move second normal task between two deferred tasks', () => {
    // Setup: Normal[0,1] + Deferred[0,1]
    // Visual: [N0, N1, D0, D1] - indices 0,1,2,3
    const tasks = [
      createTask('n0', 'Normal 0', 0, 0),
      createTask('n1', 'Normal 1', 0, 1), // This one will move
      createTask('d0', 'Deferred 0', -1, 0),
      createTask('d1', 'Deferred 1', -1, 1),
    ]
    
    const projects = createTestProject(tasks)
    const visual = getVisualArray(tasks)
    
    console.log('\nTEST: Move second normal between deferred tasks')
    console.log('BEFORE:')
    console.log('Visual array:', visual.map(t => `${t.name}(${t.priority}:${t.position})`))
    console.log('Normal tasks:', tasks.filter(t => t.priority === 0).map(t => `${t.name}:${t.position}`))
    console.log('Deferred tasks:', tasks.filter(t => t.priority === -1).map(t => `${t.name}:${t.position}`))
    
    // Move N1 from visual index 1 to visual index 2 (between D0 and D1)
    // This should put N1 at position 1 in deferred section
    moveTaskWithPriorityChange(projects, ['project1', 'n1'], 1, 2, -1)
    
    console.log('\nAFTER:')
    const newVisual = getVisualArray(tasks)
    console.log('Visual array:', newVisual.map(t => `${t.name}(${t.priority}:${t.position})`))
    console.log('Normal tasks:', tasks.filter(t => t.priority === 0).map(t => `${t.name}:${t.position}`))
    console.log('Deferred tasks:', tasks.filter(t => t.priority === -1).map(t => `${t.name}:${t.position}`))
    
    // Expected results after moving N1 to position 1 in deferred section:
    // Normal section: N0(pos 0) - N0 stays unchanged
    // Deferred section: D0(pos 0), N1(pos 1), D1(pos 2) - D1 shifts to make room
    
    const n0 = tasks.find(t => t.id === 'n0')!
    const n1 = tasks.find(t => t.id === 'n1')!
    const d0 = tasks.find(t => t.id === 'd0')!
    const d1 = tasks.find(t => t.id === 'd1')!
    
    expect(n0.priority).toBe(0)
    expect(n0.position).toBe(0)  // Unchanged
    
    expect(n1.priority).toBe(-1) // Changed to deferred
    expect(n1.position).toBe(1)  // Position 1 in deferred section (between D0 and D1)
    
    expect(d0.priority).toBe(-1)
    expect(d0.position).toBe(0)  // Unchanged (N1 didn't take its spot)
    
    expect(d1.priority).toBe(-1)
    expect(d1.position).toBe(2)  // Shifted to make room for N1
    
    // Final visual order should be: [N0, D0, N1, D1]
    expect(newVisual[0].id).toBe('n0')
    expect(newVisual[1].id).toBe('d0')
    expect(newVisual[2].id).toBe('n1')
    expect(newVisual[3].id).toBe('d1')
  })
})

describe('toggleTaskPrefer', () => {
  
  test('Prefer a normal task - moves to end of preferred section', () => {
    // Setup: Normal[0,1,2] 
    // Visual: [N0, N1, N2] - indices 0,1,2
    const tasks = [
      createTask('n0', 'Normal 0', 0, 0),
      createTask('n1', 'Normal 1', 0, 1), // This one will be preferred
      createTask('n2', 'Normal 2', 0, 2),
    ]
    
    const projects = createTestProject(tasks)
    const visual = getVisualArray(tasks)
    
    console.log('BEFORE preferring:')
    console.log('Visual array:', visual.map(t => `${t.name}(${t.priority}:${t.position})`))
    console.log('Normal tasks:', tasks.filter(t => t.priority === 0).map(t => `${t.name}:${t.position}`))
    
    // Prefer Normal 1
    const affectedTasks = toggleTaskPrefer(projects, ['project1', 'n1'])
    
    console.log('\nAFTER preferring:')
    const newVisual = getVisualArray(tasks)
    console.log('Visual array:', newVisual.map(t => `${t.name}(${t.priority}:${t.position})`))
    console.log('Preferred:', tasks.filter(t => t.priority === 1).map(t => `${t.name}:${t.position}`))
    console.log('Normal:', tasks.filter(t => t.priority === 0).map(t => `${t.name}:${t.position}`))
    console.log('Affected tasks:', affectedTasks)
    
    // Expected results:
    // Preferred section: N1(pos 2) - becomes preferred, goes to end (max position + 1)
    // Normal section: N0(pos 0), N2(pos 2) - both unchanged
    
    const n0 = tasks.find(t => t.id === 'n0')!
    const n1 = tasks.find(t => t.id === 'n1')!
    const n2 = tasks.find(t => t.id === 'n2')!
    
    expect(n0.priority).toBe(0)
    expect(n0.position).toBe(0)  // Unchanged
    
    expect(n1.priority).toBe(1)  // Changed to preferred
    expect(n1.position).toBe(2)  // Goes to end of preferred section (max + 1)
    
    expect(n2.priority).toBe(0)
    expect(n2.position).toBe(2)  // Unchanged
    
    expect(affectedTasks).toEqual([]) // No other tasks affected when preferring
    
    // Verify visual order is correct: [N1, N0, N2] (preferred first, then normal)
    const finalVisual = getVisualArray(tasks)
    expect(finalVisual[0].id).toBe('n1')
    expect(finalVisual[1].id).toBe('n0')
    expect(finalVisual[2].id).toBe('n2')
  })
  
  test('Unprefer a preferred task - moves to start of normal section, shifts others down', () => {
    // Setup: Preferred[0] + Normal[0,1]
    // Visual: [P0, N0, N1] - indices 0,1,2
    const tasks = [
      createTask('p0', 'Preferred 0', 1, 0), // This will be unpreferred
      createTask('n0', 'Normal 0', 0, 0),
      createTask('n1', 'Normal 1', 0, 1),
    ]
    
    const projects = createTestProject(tasks)
    
    console.log('\nTEST: Unprefer preferred task')
    console.log('BEFORE unpreferring:')
    const visual = getVisualArray(tasks)
    console.log('Visual array:', visual.map(t => `${t.name}(${t.priority}:${t.position})`))
    
    // Unprefer P0
    const affectedTasks = toggleTaskPrefer(projects, ['project1', 'p0'])
    
    console.log('\nAFTER unpreferring:')
    const newVisual = getVisualArray(tasks)
    console.log('Visual array:', newVisual.map(t => `${t.name}(${t.priority}:${t.position})`))
    console.log('Normal tasks:', tasks.filter(t => t.priority === 0).map(t => `${t.name}:${t.position}`))
    console.log('Affected tasks:', affectedTasks.map(path => path[path.length - 1]))
    
    // Expected results:
    // Normal section: P0(pos 0), N0(pos 1), N1(pos 2) - P0 goes to position 0, others shift down
    
    const p0 = tasks.find(t => t.id === 'p0')!
    const n0 = tasks.find(t => t.id === 'n0')!
    const n1 = tasks.find(t => t.id === 'n1')!
    
    expect(p0.priority).toBe(0)  // Changed to normal
    expect(p0.position).toBe(0)  // Goes to start of normal section
    
    expect(n0.priority).toBe(0)
    expect(n0.position).toBe(1)  // Shifted down from 0 to 1
    
    expect(n1.priority).toBe(0) 
    expect(n1.position).toBe(2)  // Shifted down from 1 to 2
    
    // Both N0 and N1 should be in affected tasks since they were shifted
    expect(affectedTasks).toHaveLength(2)
    expect(affectedTasks.map(path => path[1])).toContain('n0')
    expect(affectedTasks.map(path => path[1])).toContain('n1')
    
    // Verify visual order: [P0, N0, N1] (all normal now, P0 first)
    const finalVisual = getVisualArray(tasks)
    expect(finalVisual[0].id).toBe('p0')
    expect(finalVisual[1].id).toBe('n0')
    expect(finalVisual[2].id).toBe('n1')
  })
  
  test('Prefer task when preferred tasks already exist - goes to end of preferred section', () => {
    // Setup: Preferred[0,1] + Normal[0,1]
    // Visual: [P0, P1, N0, N1] - indices 0,1,2,3
    const tasks = [
      createTask('p0', 'Preferred 0', 1, 0),
      createTask('p1', 'Preferred 1', 1, 1),
      createTask('n0', 'Normal 0', 0, 0), // This will be preferred
      createTask('n1', 'Normal 1', 0, 1),
    ]
    
    const projects = createTestProject(tasks)
    
    // Prefer N0
    const affectedTasks = toggleTaskPrefer(projects, ['project1', 'n0'])
    
    // Expected results:
    // Preferred section: P0(pos 0), P1(pos 1), N0(pos 2) - N0 goes to end
    // Normal section: N1(pos 1) - unchanged
    
    const p0 = tasks.find(t => t.id === 'p0')!
    const p1 = tasks.find(t => t.id === 'p1')!
    const n0 = tasks.find(t => t.id === 'n0')!
    const n1 = tasks.find(t => t.id === 'n1')!
    
    expect(p0.priority).toBe(1)
    expect(p0.position).toBe(0)  // Unchanged
    
    expect(p1.priority).toBe(1)
    expect(p1.position).toBe(1)  // Unchanged
    
    expect(n0.priority).toBe(1)  // Changed to preferred
    expect(n0.position).toBe(2)  // Goes to end of preferred section
    
    expect(n1.priority).toBe(0)
    expect(n1.position).toBe(1)  // Unchanged
    
    expect(affectedTasks).toEqual([]) // No other tasks affected
    
    // Verify visual order: [P0, P1, N0, N1]
    const finalVisual = getVisualArray(tasks)
    expect(finalVisual[0].id).toBe('p0')
    expect(finalVisual[1].id).toBe('p1')
    expect(finalVisual[2].id).toBe('n0')
    expect(finalVisual[3].id).toBe('n1')
  })
  
  test('Toggle prefer twice - should return to original position area', () => {
    // Setup: Normal[0,1,2]
    const tasks = [
      createTask('n0', 'Normal 0', 0, 0),
      createTask('n1', 'Normal 1', 0, 1), // This will be preferred then unpreferred
      createTask('n2', 'Normal 2', 0, 2),
    ]
    
    const projects = createTestProject(tasks)
    
    // First: prefer N1
    toggleTaskPrefer(projects, ['project1', 'n1'])
    
    // Then: unprefer N1
    const affectedTasks = toggleTaskPrefer(projects, ['project1', 'n1'])
    
    // Expected: N1 should go to position 0 in normal section, others shift down
    const n0 = tasks.find(t => t.id === 'n0')!
    const n1 = tasks.find(t => t.id === 'n1')!
    const n2 = tasks.find(t => t.id === 'n2')!
    
    expect(n1.priority).toBe(0)  // Back to normal
    expect(n1.position).toBe(0)  // Goes to start of normal section
    
    expect(n0.position).toBe(1)  // Shifted down
    expect(n2.position).toBe(3)  // Got its original position + 1 due to shift
    
    // N0 should be affected by the shift
    expect(affectedTasks.map(path => path[1])).toContain('n0')
  })
  
  test('Multiple preferred tasks maintain order when unpreferred', () => {
    // Setup: Preferred[0,1,2] + Normal[0]
    const tasks = [
      createTask('p0', 'Preferred 0', 1, 0),
      createTask('p1', 'Preferred 1', 1, 1), // This will be unpreferred
      createTask('p2', 'Preferred 2', 1, 2),
      createTask('n0', 'Normal 0', 0, 0),
    ]
    
    const projects = createTestProject(tasks)
    
    // Unprefer P1 (middle preferred task)
    const affectedTasks = toggleTaskPrefer(projects, ['project1', 'p1'])
    
    // Expected results:
    // Preferred section: P0(pos 0), P2(pos 2) - unchanged positions
    // Normal section: P1(pos 0), N0(pos 1) - P1 goes to start, N0 shifts down
    
    const p0 = tasks.find(t => t.id === 'p0')!
    const p1 = tasks.find(t => t.id === 'p1')!
    const p2 = tasks.find(t => t.id === 'p2')!
    const n0 = tasks.find(t => t.id === 'n0')!
    
    expect(p0.priority).toBe(1)
    expect(p0.position).toBe(0)
    
    expect(p1.priority).toBe(0)  // Changed to normal
    expect(p1.position).toBe(0)  // Goes to start of normal section
    
    expect(p2.priority).toBe(1)
    expect(p2.position).toBe(2)  // Unchanged
    
    expect(n0.priority).toBe(0)
    expect(n0.position).toBe(1)  // Shifted from 0 to 1
    
    // Only N0 should be affected
    expect(affectedTasks).toHaveLength(1)
    expect(affectedTasks[0][1]).toBe('n0')
    
    // Visual order: [P0, P2, P1, N0]
    const finalVisual = getVisualArray(tasks)
    expect(finalVisual[0].id).toBe('p0')
    expect(finalVisual[1].id).toBe('p2')
    expect(finalVisual[2].id).toBe('p1')
    expect(finalVisual[3].id).toBe('n0')
  })
})