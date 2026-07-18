'use client'

import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from '@/lib/sync-engine'
import { useEffect, useState } from 'react'
import { WifiOff, MoreHorizontal, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SyncStatus() {
  const { getPendingCount, lastSyncedAt, syncLoading, isInitialized } = useSyncStore()
  const [isOnline, setIsOnline] = useState(true) // Start with true to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  
  const pendingCount = getPendingCount()
  
  // Helper function to calculate sync time display
  const getSyncTimeText = () => {
    if (lastSyncedAt === 0) return 'Ready'
    
    const timeSinceSync = now - lastSyncedAt
    const minutes = Math.floor(timeSinceSync / (1000 * 60))
    
    if (minutes < 1) return 'Synced'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const getDetailedSyncTime = () => {
    if (lastSyncedAt === 0) return 'No successful sync yet'

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(lastSyncedAt))
  }

  const handleForceSync = async () => {
    if (!isOnline || syncLoading || !isInitialized) return

    try {
      await syncEngine.syncNow()
    } catch (error) {
      console.error('Failed to sync manually:', error)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    setIsOnline(navigator.onLine)
    
    // Initialize sync engine when component mounts (only if not already initialized)
    if (!isInitialized) {
      syncEngine.init().catch((error) => {
        console.error(`Sync engine initialization failed:`, error)
      })
    }
  }, [isInitialized])

  useEffect(() => {
    if (!isMounted) return

    const updateCurrentTime = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(updateCurrentTime)
  }, [isMounted])

  useEffect(() => {
    if (!isMounted) return
    
    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true)
      // Trigger sync when coming back online
      if (isInitialized) {
        syncEngine.syncNow().catch((error) => {
          console.error('Failed to sync after coming online:', error)
        })
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isInitialized, isMounted])

  let IconComponent = Check
  let syncText = getSyncTimeText()
  let animated = false
  let colorClass = 'text-muted-foreground'

  if (syncLoading) {
    IconComponent = MoreHorizontal
    syncText = pendingCount > 0 ? `Syncing... (${pendingCount} remaining)` : 'Syncing...'
    animated = true
  } else if (isMounted && !isOnline) {
    IconComponent = WifiOff
    syncText = 'Offline'
    colorClass = 'text-amber-500 dark:text-amber-400'
  } else if (pendingCount > 0) {
    IconComponent = MoreHorizontal
    syncText = `${pendingCount} pending`
    animated = true
  } else if (syncText === 'Ready') {
    IconComponent = MoreHorizontal
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className={`flex items-center space-x-2 rounded-sm ${colorClass} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
        aria-label={`Sync status: ${syncText}`}
      >
        <IconComponent className={`h-3 w-3 ${animated ? 'animate-pulse' : ''}`} />
        <span className="text-xs" aria-live="polite">{syncText}</span>
      </button>

      <div className="invisible absolute left-0 top-full z-50 w-64 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
          <p className="text-xs font-medium">Last synced</p>
          <p className="mt-1 text-xs text-muted-foreground">{getDetailedSyncTime()}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={handleForceSync}
            disabled={!isOnline || syncLoading || !isInitialized}
          >
            <RefreshCw className={syncLoading ? 'animate-spin' : ''} />
            {syncLoading ? 'Syncing...' : 'Sync now'}
          </Button>
        </div>
      </div>
    </div>
  )
}
