import { TaskPath } from './task-path'

describe('TaskPath', () => {
  test('models project-list, project, and task paths', () => {
    expect(TaskPath.isProjectList(TaskPath.empty())).toBe(true)
    expect(TaskPath.isProject(TaskPath.from('project'))).toBe(true)
    expect(TaskPath.isTask(TaskPath.from('project', 'task'))).toBe(true)
  })

  test('provides immutable-style tree operations', () => {
    const parent = TaskPath.from('project', 'parent')
    const child = TaskPath.append(parent, 'child')

    expect(parent).toEqual(['project', 'parent'])
    expect(child).toEqual(['project', 'parent', 'child'])
    expect(TaskPath.parent(child)).toEqual(parent)
    expect(TaskPath.projectId(child)).toBe('project')
    expect(TaskPath.isPrefixOf(parent, child)).toBe(true)
    expect(TaskPath.isDescendantOf(child, parent)).toBe(true)
    expect(TaskPath.equals(child, TaskPath.from('project', 'parent', 'child'))).toBe(true)
    expect(TaskPath.serialize(child)).toBe('project/parent/child')
  })
})
