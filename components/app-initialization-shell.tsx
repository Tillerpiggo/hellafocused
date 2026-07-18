"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { AppLoadingState } from "@/components/app-loading-state"
import { syncEngine } from "@/lib/sync-engine"
import { useSyncStore } from "@/store/sync-store"
import { useGlobalReminderCheck } from "@/hooks/use-global-reminder-check"

const AppPageReadyContext = createContext<(() => void) | null>(null)

export function useMarkAppPageReady() {
  const markPageReady = useContext(AppPageReadyContext)

  useEffect(() => {
    markPageReady?.()
  }, [markPageReady])
}

export function AppInitializationShell({ children }: { children: React.ReactNode }) {
  const isInitialized = useSyncStore((state) => state.isInitialized)
  const [isPageReady, setIsPageReady] = useState(false)
  const markPageReady = useCallback(() => setIsPageReady(true), [])

  useGlobalReminderCheck()

  useEffect(() => {
    if (isInitialized) return

    syncEngine.init().catch((error) => {
      console.error("App initialization failed:", error)
    })
  }, [isInitialized])

  useEffect(() => {
    if (!isInitialized) setIsPageReady(false)
  }, [isInitialized])

  const showLoading = !isInitialized || !isPageReady

  return (
    <AppPageReadyContext.Provider value={markPageReady}>
      <div className="relative h-screen bg-background overflow-hidden">
        {isInitialized ? children : null}
        {showLoading && (
          <div className="absolute inset-0 z-[60] bg-background">
            <AppLoadingState />
          </div>
        )}
      </div>
    </AppPageReadyContext.Provider>
  )
}
