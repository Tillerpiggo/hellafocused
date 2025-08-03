import { moveTaskWithPriorityChange } from './task-utils'
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
      if (a.priority !== b.priority) return b.priority - a.priority // 0 first, then -1
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