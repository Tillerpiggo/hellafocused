import { useAppStore } from './app-store'
import { useNavigationStore } from './navigation-store'

describe('navigation store', () => {
  beforeEach(() => {
    useNavigationStore.setState({ currentPath: [], navigationContext: [] })
  })

  test('navigates deeper and back while preserving breadcrumb context', () => {
    const navigation = useNavigationStore.getState()

    navigation.selectProject('project')
    useNavigationStore.getState().navigateToTask('parent')
    useNavigationStore.getState().navigateToTask('child')
    useNavigationStore.getState().navigateBack()

    expect(useNavigationStore.getState().currentPath).toEqual(['project', 'parent'])
    expect(useNavigationStore.getState().navigationContext).toEqual(['project', 'parent', 'child'])
  })

  test('resets breadcrumb context when switching branches or projects', () => {
    useNavigationStore.setState({
      currentPath: ['project', 'parent'],
      navigationContext: ['project', 'parent', 'child'],
    })

    useNavigationStore.getState().navigateToPath(['project', 'sibling'])
    expect(useNavigationStore.getState().navigationContext).toEqual(['project', 'sibling'])

    useNavigationStore.getState().navigateToPath(['other-project'])
    expect(useNavigationStore.getState().navigationContext).toEqual(['other-project'])
  })

  test('does not mutate or embed navigation state in the project store', () => {
    const projects = useAppStore.getState().projects

    useNavigationStore.getState().selectProject('project')
    useNavigationStore.getState().navigateToTask('task')

    expect(useAppStore.getState().projects).toBe(projects)
    expect(useAppStore.getState()).not.toHaveProperty('currentPath')
    expect(useNavigationStore.getState().currentPath).toEqual(['project', 'task'])
  })
})
