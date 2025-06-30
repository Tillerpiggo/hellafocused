'use client'

import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from '@/lib/sync-engine'
import { useEffect, useState } from 'react'
import { WifiOff, Upload, Check, RotateCcw } from 'lucide-react'

export function SyncStatus() {
  console.log(`🎨 SyncStatus component rendered`)
  const { getPendingCount, lastSyncedAt } = useSyncStore()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  const pendingCount = getPendingCount()
  
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

  useEffect(() => {
    // Online/offline detection
    const handleOnline = () => {
      console.log(`🌐 User came back online, triggering sync...`)
      setIsOnline(true)
      // Trigger sync when coming back online
      if (isInitialized) {
        syncEngine.syncPendingChanges().catch((error) => {
          console.error('Failed to sync after coming online:', error)
        })
      }
    }

    const handleOffline = () => {
      console.log(`🌐 User went offline`)
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isInitialized])

  console.log(`🎨 SyncStatus render state:`, { isInitialized, pendingCount, isOnline, lastSyncedAt })

  if (!isInitialized) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
        Initializing sync...
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <WifiOff className="h-4 w-4 mr-2" />
        Offline {lastSyncedAt ? `• Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : ''}
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Upload className="h-4 w-4 mr-2" />
        {pendingCount} pending
      </div>
    )
  }

  return (
    <div className="flex items-center text-sm text-muted-foreground">
      <Check className="h-4 w-4 mr-2 text-green-600" />
      {lastSyncedAt ? (
        <>Synced {new Date(lastSyncedAt).toLocaleTimeString()}</>
      ) : (
        <>All synced</>
      )}
    </div>
  )
} 