export function shouldAnimateFocusEntrance(
  previousSessionId: string | null,
  nextSessionId: string,
): boolean {
  return previousSessionId === null || previousSessionId === nextSessionId
}
