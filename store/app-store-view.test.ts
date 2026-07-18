import type { ProjectData, TaskData } from '@/lib/types'
import { getCurrentTaskViewData } from './app-store'

function task(
  id: string,
  options: Partial<TaskData> = {},
  subtasks: TaskData[] = []
): TaskData {
  return {
    id,
    name: id,
    completed: false,
    lastModificationDate: '2026-01-01T00:00:00.000Z',
    position: 0,
    priority: 0,
    subtasks,
    ...options,
  }
}

describe('getCurrentTaskViewData', () => {
  const orderedParent = task('parent', { isOrdered: true }, [
    task('normal', { position: 0 }),
    task('preferred', { priority: 1, position: 0 }),
    task('completed', { completed: true, position: 1 }),
  ])
  const projects: ProjectData[] = [{
    id: 'project',
    name: 'Project',
    lastModificationDate: '2026-01-01T00:00:00.000Z',
    tasks: [orderedParent],
  }]

  test('resolves the project, chain, current task, visible tasks, and numbering together', () => {
    const view = getCurrentTaskViewData(
      projects,
      ['project', 'parent'],
      '',
      false
    )

    expect(view.project?.id).toBe('project')
    expect(view.taskChain.map((item) => item.id)).toEqual(['parent'])
    expect(view.currentTask?.id).toBe('parent')
    expect(view.tasks.map((item) => item.id)).toEqual(['preferred', 'normal'])
    expect(view.orderedNumberMap).toEqual({ preferred: 1, normal: 2, completed: 3 })
  })

  test('returns no current task or children for a broken path', () => {
    const view = getCurrentTaskViewData(
      projects,
      ['project', 'missing'],
      '',
      false
    )

    expect(view.project?.id).toBe('project')
    expect(view.taskChain).toEqual([])
    expect(view.currentTask).toBeNull()
    expect(view.tasks).toEqual([])
  })
})
