import { shouldAnimateFocusEntrance } from './focus-session-transition'

describe('focus session entrance animation', () => {
  test('animates the initial focus-session entrance', () => {
    expect(shouldAnimateFocusEntrance(null, 'session-a')).toBe(true)
  })

  test('allows transitions within the current focus session', () => {
    expect(shouldAnimateFocusEntrance('session-a', 'session-a')).toBe(true)
  })

  test('does not animate when selecting another focus session', () => {
    expect(shouldAnimateFocusEntrance('session-a', 'session-b')).toBe(false)
  })
})
