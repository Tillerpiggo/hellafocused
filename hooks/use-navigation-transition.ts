import { useRef, useState, useEffect } from "react"
import { arePathsEqual } from "@/lib/task-utils"

export function useNavigationTransition(currentPath: string[]) {
  const committedPathRef = useRef<string[]>(currentPath)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [justFinished, setJustFinished] = useState(false)

  const pathChanged = !arePathsEqual(currentPath, committedPathRef.current)

  if (pathChanged && !isTransitioning) {
    setIsTransitioning(true)
  }

  useEffect(() => {
    if (isTransitioning) {
      const rafId = requestAnimationFrame(() => {
        committedPathRef.current = currentPath
        setIsTransitioning(false)
        setJustFinished(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [isTransitioning, currentPath])

  useEffect(() => {
    if (justFinished) {
      const timeout = setTimeout(() => setJustFinished(false), 400)
      return () => clearTimeout(timeout)
    }
  }, [justFinished])

  return { isTransitioning, justFinished }
}
