'use client'

import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from '@/lib/sync-engine'
import { useEffect, useState } from 'react'

export function SyncStatus() {
  console.log(`🎨 SyncStatus component rendered`)
  const { getPendingCount, getFailedCount, lastSyncedAt } = useSyncStore()
  const [isInitialized, setIsInitialized] = useState(false)
  
  const pendingCount = getPendingCount()
  const failedCount = getFailedCount()
  
  useEffect(() => {
    console.log(`🎨 SyncStatus useEffect called, isInitialized: ${isInitialized}`)
    // Initialize sync engine when component mounts
    if (!isInitialized) {
      console.log(`🎨 Starting sync engine initialization...`)
      syncEngine.init().then(() => {
        console.log(`🎨 Sync engine initialization completed`)
        setIsInitialized(true)
      }).catch((error) => {
        console.error(`🎨 Sync engine initialization failed:`, error)
      })
    }
  }, [isInitialized])

  console.log(`🎨 SyncStatus render state:`, { isInitialized, pendingCount, failedCount, lastSyncedAt })

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