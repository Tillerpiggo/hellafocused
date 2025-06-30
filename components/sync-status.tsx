'use client'

import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from '@/lib/sync-engine'
import { useEffect, useState } from 'react'
import { WifiOff, MoreHorizontal, Check } from 'lucide-react'

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
      <div className="flex items-center text-xs text-muted-foreground/70">
        <MoreHorizontal className="h-3 w-3 mr-1.5 animate-pulse" />
        Syncing
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="flex items-center text-xs text-muted-foreground/70">
        <WifiOff className="h-3 w-3 mr-1.5" />
        {lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Offline'}
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center text-xs text-muted-foreground/70">
        <MoreHorizontal className="h-3 w-3 mr-1.5 animate-pulse" />
        {lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Syncing'}
      </div>
    )
  }

  return (
    <div className="flex items-center text-xs text-muted-foreground/70">
      <Check className="h-3 w-3 mr-1.5 text-green-500/70" />
      Synced
    </div>
  )
} 