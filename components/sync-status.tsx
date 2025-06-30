'use client'

import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from '@/lib/sync-engine'
import { useEffect, useState } from 'react'

export function SyncStatus() {
  const { getPendingCount, getFailedCount, lastSyncedAt } = useSyncStore()
  const [isInitialized, setIsInitialized] = useState(false)
  
  const pendingCount = getPendingCount()
  const failedCount = getFailedCount()
  
  useEffect(() => {
    // Initialize sync engine when component mounts
    if (!isInitialized) {
      syncEngine.init().then(() => {
        setIsInitialized(true)
      }).catch(console.error)
    }
  }, [isInitialized])

  if (!isInitialized) {
    return (
      <div className="text-sm text-muted-foreground">
        Initializing sync...
      </div>
    )
  }

  if (failedCount > 0) {
    return (
      <div className="text-sm text-destructive">
        ⚠️ {failedCount} sync errors
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="text-sm text-muted-foreground">
        📤 {pendingCount} pending
      </div>
    )
  }

  return (
    <div className="text-sm text-muted-foreground">
      {lastSyncedAt ? (
        <>✅ Synced {new Date(lastSyncedAt).toLocaleTimeString()}</>
      ) : (
        <>✅ All synced</>
      )}
    </div>
  )
} 