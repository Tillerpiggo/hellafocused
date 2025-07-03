'use client'

import { useSyncStore } from '@/store/sync-store'
import { syncEngine } from '@/lib/sync-engine'
import { useEffect, useState } from 'react'
import { WifiOff, MoreHorizontal, Check } from 'lucide-react'

export function SyncStatus() {
  const { getPendingCount, lastSyncedAt, syncLoading, isInitialized } = useSyncStore()
  const [isOnline, setIsOnline] = useState(true) // Start with true to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  
  const pendingCount = getPendingCount()
  
  // Helper function to calculate sync time display
  const getSyncTimeText = () => {
    if (lastSyncedAt === 0) return 'Ready'
    
    const timeSinceSync = Date.now() - lastSyncedAt
    const minutes = Math.floor(timeSinceSync / (1000 * 60))
    
    if (minutes < 1) return 'Synced'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  // Helper function to render status with icon and text
  const renderStatus = (IconComponent: any, text: string, animated = false) => (
    <div className="flex items-center space-x-2 text-muted-foreground">
      <IconComponent className={`h-3 w-3 ${animated ? 'animate-pulse' : ''}`} />
      <span className="text-xs">{text}</span>
    </div>
  )

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
    
    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true)
      // Trigger sync when coming back online
      if (isInitialized) {
        syncEngine.syncPendingChanges().catch((error) => {
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

  // Show loading when sync is loading
  if (syncLoading) {
    return renderStatus(MoreHorizontal, 'Syncing...', true)
  }

  // Show offline status (only after mounting to avoid hydration mismatch)
  if (isMounted && !isOnline) {
    return renderStatus(WifiOff, 'Offline')
  }

  // Show pending changes count
  if (pendingCount > 0) {
    return renderStatus(MoreHorizontal, `${pendingCount} pending`, true)
  }

  // Show sync status with appropriate icon
  const syncText = getSyncTimeText()
  const IconComponent = syncText === 'Ready' ? MoreHorizontal : Check
  
  return renderStatus(IconComponent, syncText)
} 