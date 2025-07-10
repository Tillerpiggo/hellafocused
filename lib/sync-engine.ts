import { supabase, type DatabaseProject, type DatabaseTask } from './supabase'
import { useAppStore } from '@/store/app-store'
import { useSyncStore } from '@/store/sync-store'
import { mergeManager } from './merge-manager'
import type { ProjectData, TaskData } from './types'
import type { RealtimePostgresChangesPayload, User } from '@supabase/supabase-js'
import { findTaskAtPath, findProjectAtPath, isProjectList, isProject } from './task-utils'
import type { SyncAction } from './sync-types'

class SyncEngine {
  private syncInterval: NodeJS.Timeout | null = null
  private realtimeSubscriptions: ReturnType<typeof supabase.channel>[] = []
  private instanceId: string = `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly batchDelay = 10

  async init() {
    // Check if already initialized to prevent double initialization
    if (useSyncStore.getState().isInitialized) {
      return
    }

    try {
      console.log("setting sync loading")
      useSyncStore.getState().setSyncLoading(true)
    
      await this.ensureAuthenticated()
      
      // Set current user in sync store
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null
      useSyncStore.getState().setCurrentUserId(user?.id || null)
      
      console.log("syncing pending changes")
      await this.syncPendingChanges()
      await this.mergeWithCloud()

      this.startPeriodicSync()
      this.setupRealtimeSync()
      console.log("sync engine initialized")
      
      // Mark as initialized
      useSyncStore.getState().setInitialized(true)
      
    } catch (error) {
      console.error('❌ Sync initialization error:', error)
    } finally {
      // Clear loading state when done
      useSyncStore.getState().setSyncLoading(false)
    }
  }

  private async ensureAuthenticated() {
    console.log("🔐 Ensuring authenticated...")
    
    // First, check current session (Supabase handles session restoration automatically)
    const { data: { session }, error: getSessionError } = await supabase.auth.getSession()
    const user = session?.user ?? null
    
    if (getSessionError) {
      console.error('❌ Error getting session:', getSessionError)
    }

    console.log("user", user)
    
    if (!user) {
      // Don't auto-sign in anonymously on auth pages
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/')) {
        console.log('🔄 Skipping anonymous sign-in on auth page:', window.location.pathname)
        return
      }
      
      // Check if we have a stored anonymous session that might have been lost
      const storedAnonymousId = localStorage.getItem('hellafocused-anonymous-user-id')
      if (storedAnonymousId) {
        console.log('⚠️ No session found but had previous anonymous user:', storedAnonymousId)
        console.log('📝 Session may have expired, creating new anonymous user')
      }
      
      console.log("🆔 Creating new anonymous user...")
      const { data, error } = await supabase.auth.signInAnonymously()
      
      if (error) {
        console.error('❌ Failed to sign in anonymously:', error)
        throw new Error(`Failed to sign in anonymously: ${error.message}`)
      }
      
      if (data.user?.id) {
        // Store the anonymous user ID for potential future migration and tracking
        sessionStorage.setItem('previous-anonymous-user-id', data.user.id)
        localStorage.setItem('hellafocused-anonymous-user-id', data.user.id)
        localStorage.setItem('hellafocused-anonymous-created-at', Date.now().toString())
        
        // Log session creation details
        if (storedAnonymousId && storedAnonymousId !== data.user.id) {
          console.log('📝 New anonymous user created (previous session lost)')
          console.log('   Previous:', storedAnonymousId)
          console.log('   New:', data.user.id)
        } else if (!storedAnonymousId) {
          console.log('📝 First-time anonymous user created:', data.user.id)
        } else {
          console.log('📝 Anonymous user session restored:', data.user.id)
        }
        
        // Sync pending changes and merge with cloud after successful sign-in
        await this.syncPendingChanges()
        await this.mergeWithCloud()
      }
    } else {
      const userType = user.is_anonymous ? 'anonymous' : 'authenticated'
      console.log(`✅ User already authenticated: ${user.id} (${userType})`)
      
      // Track the current session
      if (user.is_anonymous) {
        // For anonymous users, ensure we're tracking this session
        sessionStorage.setItem('previous-anonymous-user-id', user.id)
        localStorage.setItem('hellafocused-anonymous-user-id', user.id)
        
        // Check if this is a session restoration
        const storedAnonymousId = localStorage.getItem('hellafocused-anonymous-user-id')
        if (storedAnonymousId === user.id) {
          const createdAt = localStorage.getItem('hellafocused-anonymous-created-at')
          if (createdAt) {
            const ageInHours = (Date.now() - parseInt(createdAt)) / (1000 * 60 * 60)
            console.log(`📝 Anonymous session restored (age: ${ageInHours.toFixed(1)} hours)`)
          }
        }
      } else {
        // If this is a real (non-anonymous) user, clean up anonymous tracking
        const storedAnonymousId = sessionStorage.getItem('previous-anonymous-user-id')
        if (storedAnonymousId && storedAnonymousId !== user.id) {
          console.log('🧹 Cleaning up anonymous session tracking for authenticated user')
          sessionStorage.removeItem('previous-anonymous-user-id')
          localStorage.removeItem('hellafocused-anonymous-user-id')
          localStorage.removeItem('hellafocused-anonymous-created-at')
        }
      }
    }
  }

  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      throw new Error('No authenticated user found')
    }
    
    return user.id
  }

  async syncSingleChange(id: string): Promise<boolean> {
    
    if (!navigator.onLine) {
      return false
    }

    const change = useSyncStore.getState().pendingChanges[id]
    if (!change || change.synced) {
      return true
    }

    try {
      switch (change.type) {
        case 'create':
          if (change.entityType === 'project') {
            await this.createProject(change.data as ProjectData)
          } else if (change.entityType === 'task') {
            await this.createTask(change.data as TaskData, change.projectId!, change.parentId)
          }
          break
        case 'update':
          if (change.entityType === 'project') {
            await this.updateProject(change.entityId, change.data as ProjectData)
          } else if (change.entityType === 'task') {
            await this.updateTask(change.entityId, change.data as TaskData)
          }
          break
        case 'delete':
          if (change.entityType === 'project') {
            await this.deleteProject(change.entityId)
          } else if (change.entityType === 'task') {
            await this.deleteTask(change.entityId)
          }
          break
      }

      // Mark as synced
      useSyncStore.getState().markSynced(id)
      
      // Merge with cloud after successful sync to get any other changes
      this.mergeWithCloud().catch(error => {
        console.error('❌ Failed to merge after sync:', error)
      })
      
      return true
    } catch (error) {
      console.error('Sync error for change', id, ':', error)
      // Track error for debugging
      useSyncStore.getState().markFailed(id, error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  /**
   * Triggers a batched sync with a delay to collect multiple changes
   */
  scheduleBatchSync() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }
    
    this.batchTimeout = setTimeout(() => {
      this.syncPendingChanges().catch(error => {
        console.error('❌ Scheduled batch sync failed:', error)
      })
      this.batchTimeout = null
    }, this.batchDelay)
  }

  async syncPendingChanges() {
    const { pendingChanges, currentUserId } = useSyncStore.getState()
    
    // No user logged in, don't sync anything
    if (!currentUserId) {
      return
    }
    
    // Filter for current user's unsynced changes
    const pending = Object.entries(pendingChanges)
      .filter(([, change]) => !change.synced && change.userId === currentUserId)
      .sort((a, b) => a[1].timestamp - b[1].timestamp) as [string, SyncAction][] // Sync in order

    if (pending.length === 0) {
      return
    }

    // Group changes by type and entity for batching
    const batches = this.groupChangesForBatching(pending)
    
    // Process batches
    for (const batch of batches) {
      try {
        if (batch.type === 'batch_task_updates') {
          await this.batchUpdateTasks(batch.changes)
        } else if (batch.type === 'batch_project_updates') {
          await this.batchUpdateProjects(batch.changes)
        } else {
          // Process single changes for create/delete operations
          for (const [id] of batch.changes) {
            await this.syncSingleChange(id)
          }
        }
      } catch (error) {
        console.error('❌ Batch sync error:', error)
        // Fall back to individual sync for this batch
        for (const [id] of batch.changes) {
          await this.syncSingleChange(id)
        }
      }
    }

    // Clean up synced changes
    useSyncStore.getState().removeSynced()
    useSyncStore.getState().updateLastSyncedAt()
  }

  private groupChangesForBatching(pending: [string, SyncAction][]) {
    const batches: Array<{
      type: string
      changes: [string, SyncAction][]
    }> = []
    
    const taskUpdates: [string, SyncAction][] = []
    const projectUpdates: [string, SyncAction][] = []
    const others: [string, SyncAction][] = []
    
    for (const item of pending) {
      const [, change] = item
      
      if (change.type === 'update' && change.entityType === 'task') {
        taskUpdates.push(item)
      } else if (change.type === 'update' && change.entityType === 'project') {
        projectUpdates.push(item)
      } else {
        others.push(item)
      }
    }
    
    // Create batches
    if (taskUpdates.length > 1) {
      batches.push({ type: 'batch_task_updates', changes: taskUpdates })
    } else if (taskUpdates.length === 1) {
      others.push(taskUpdates[0])
    }
    
    if (projectUpdates.length > 1) {
      batches.push({ type: 'batch_project_updates', changes: projectUpdates })
    } else if (projectUpdates.length === 1) {
      others.push(projectUpdates[0])
    }
    
    if (others.length > 0) {
      batches.push({ type: 'individual', changes: others })
    }
    
    return batches
  }

  private async batchUpdateTasks(changes: [string, SyncAction][]) {
    const userId = await this.getCurrentUserId()
    
    // Prepare batch update data
    const updates = changes.map(([, change]) => {
      const taskData = change.data as TaskData
      if (!taskData) {
        throw new Error('Task data is null for update operation')
      }
      
      return {
        id: change.entityId,
        name: taskData.name,
        completed: taskData.completed,
        completion_date: taskData.completionDate || null,
        position: taskData.position ?? 0,
        updated_at: taskData.lastModificationDate,
        user_id: userId,
        project_id: change.projectId, // Get from sync action metadata
        parent_id: change.parentId || null, // Get from sync action metadata
      }
    })
    
    console.log(`🔄 Batch updating ${updates.length} tasks`)
    
    // Use upsert for batch update
    const { error } = await supabase
      .from('tasks')
      .upsert(updates, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) {
      throw new Error(`Failed to batch update tasks: ${error.message}`)
    }
    
    // Mark all changes as synced
    for (const [id] of changes) {
      useSyncStore.getState().markSynced(id)
    }
  }

  private async batchUpdateProjects(changes: [string, SyncAction][]) {
    const userId = await this.getCurrentUserId()
    
    // Prepare batch update data
    const updates = changes.map(([, change]) => {
      const projectData = change.data as ProjectData
      if (!projectData) {
        throw new Error('Project data is null for update operation')
      }
      
      return {
        id: change.entityId,
        name: projectData.name,
        updated_at: projectData.lastModificationDate,
        user_id: userId,
      }
    })
    
    console.log(`🔄 Batch updating ${updates.length} projects`)
    
    // Use upsert for batch update
    const { error } = await supabase
      .from('projects')
      .upsert(updates, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) {
      throw new Error(`Failed to batch update projects: ${error.message}`)
    }
    
    // Mark all changes as synced
    for (const [id] of changes) {
      useSyncStore.getState().markSynced(id)
    }
  }

  async mergeWithCloud() {
    try {
      const userId = await this.getCurrentUserId()
      
      // Fetch projects and tasks from Supabase
      const { data: cloudProjects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)

      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
        return
      }

      const { data: cloudTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError)
        return
      }

      if (cloudProjects && cloudTasks) {
        await mergeManager.mergeCloudWithLocal(cloudProjects, cloudTasks)
        
        // Validate and fix current path after merge
        this.validateAndFixCurrentPath()
      }
    } catch (error) {
      // Continue with local data if cloud fetch fails
      console.error('Cloud merge failed:', error)
    }
  }

  private validateAndFixCurrentPath() {
    const { projects, currentPath } = useAppStore.getState()
    
    // Project list is always valid
    if (isProjectList(currentPath)) {
      return
    }
    
    // Check if current path is valid
    let validPath = [...currentPath]
    
    while (validPath.length > 0) {
      if (isProject(validPath)) {
        // Check if project exists
        const project = findProjectAtPath(projects, validPath)
        if (project) {
          break // Valid project path
        }
      } else {
        // Check if task exists
        const task = findTaskAtPath(projects, validPath)
        if (task) {
          break // Valid task path
        }
      }
      
      // Path is invalid, go one level up
      validPath = validPath.slice(0, -1)
    }
    
    // If the path changed, update the app store
    if (validPath.length !== currentPath.length || 
        !validPath.every((id, index) => id === currentPath[index])) {
      console.log('🔄 Fixing invalid path:', currentPath, '→', validPath)
      useAppStore.setState({ currentPath: validPath })
    }
  }

  private startPeriodicSync() {
    // Sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      console.log('🔄 Periodic sync timer')
      if (navigator.onLine) {
        await this.syncPendingChanges()
      }
    }, 30000)
  }

  private setupRealtimeSync() {
    this.getCurrentUserId().then(userId => {
      // Subscribe to project changes
      const projectsSubscription = supabase
        .channel('projects-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'projects',
            filter: `user_id=eq.${userId}`
          }, 
          (payload: RealtimePostgresChangesPayload<DatabaseProject>) => {
            // Skip changes from the same tab instance to avoid echo
            const newInstanceId = payload.new && 'device_id' in payload.new ? payload.new.device_id : null
            const oldInstanceId = payload.old && 'device_id' in payload.old ? payload.old.device_id : null
            
            if (newInstanceId === this.instanceId || oldInstanceId === this.instanceId) {
              return
            }
            
            console.log('📥 Received project change from another tab/device:', payload.eventType, payload.new || payload.old)
            this.mergeWithCloud().catch(error => {
              console.error('❌ Failed to merge project changes:', error)
            })
          }
        )
        .subscribe()

      // Subscribe to task changes
      const tasksSubscription = supabase
        .channel('tasks-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'tasks',
            filter: `user_id=eq.${userId}`
          }, 
          (payload: RealtimePostgresChangesPayload<DatabaseTask>) => {
            // Skip changes from the same tab instance to avoid echo
            const newInstanceId = payload.new && 'device_id' in payload.new ? payload.new.device_id : null
            const oldInstanceId = payload.old && 'device_id' in payload.old ? payload.old.device_id : null
            
            if (newInstanceId === this.instanceId || oldInstanceId === this.instanceId) {
              return
            }
            
            console.log('📥 Received task change from another tab/device:', payload.eventType, payload.new || payload.old)
            this.mergeWithCloud().catch(error => {
              console.error('❌ Failed to merge task changes:', error)
            })
          }
        )
        .subscribe()

      // Store subscriptions for cleanup
      this.realtimeSubscriptions = [projectsSubscription, tasksSubscription]
      
      console.log('🔄 Real-time sync subscriptions established for instance:', this.instanceId)
    }).catch(error => {
      console.error('❌ Failed to setup real-time sync:', error)
    })
  }

  // Database operations
  private async createProject(project: ProjectData) {
    const userId = await this.getCurrentUserId()
    const now = new Date().toISOString()
    
    const { error } = await supabase.from('projects').insert({
      id: project.id,
      name: project.name,
      user_id: userId,
      device_id: this.instanceId,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    })

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`)
    }
  }

  private async updateProject(projectId: string, project: ProjectData) {
    const userId = await this.getCurrentUserId()
    
    const { error } = await supabase
      .from('projects')
      .update({
        name: project.name,
        updated_at: project.lastModificationDate,
      })
      .eq('id', projectId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`)
    }
  }

  private async deleteProject(projectId: string) {
    const userId = await this.getCurrentUserId()
    
    const { error } = await supabase
      .from('projects')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`)
    }
  }

  private async createTask(task: TaskData, projectId: string, parentId?: string) {
    const userId = await this.getCurrentUserId()
    const now = new Date().toISOString()
    
    // Calculate position if not set - query database for existing tasks at same level
    let position = task.position ?? 0
    if (position === 0) {
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('parent_id', parentId || null)
        .eq('user_id', userId)
        .eq('is_deleted', false)
      
      position = (count || 0)
    }
    
    const { error } = await supabase.from('tasks').insert({
      id: task.id,
      name: task.name,
      project_id: projectId,
      parent_id: parentId || null,
      completed: task.completed,
      completion_date: task.completionDate || null,
      position: position,
      user_id: userId,
      device_id: this.instanceId,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    })

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }
  }

  private async updateTask(taskId: string, task: TaskData) {
    const userId = await this.getCurrentUserId()
    
    const { error } = await supabase
      .from('tasks')
      .update({
        name: task.name,
        completed: task.completed,
        completion_date: task.completionDate || null,
        position: task.position ?? 0,
        updated_at: task.lastModificationDate,
      })
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }
  }

  private async deleteTask(taskId: string) {
    const userId = await this.getCurrentUserId()
    
    const { error } = await supabase
      .from('tasks')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  }



  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    console.log('cleanup real-time subscriptions', this.realtimeSubscriptions)
    
    // Clean up real-time subscriptions
    this.realtimeSubscriptions.forEach(subscription => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe()
      }
    })
    this.realtimeSubscriptions = []
  }

  /**
   * Debug utility to check anonymous session health
   */
  getAnonymousSessionInfo() {
    const anonymousId = localStorage.getItem('hellafocused-anonymous-user-id')
    const createdAt = localStorage.getItem('hellafocused-anonymous-created-at')
    const sessionAnonymousId = sessionStorage.getItem('previous-anonymous-user-id')
    
    if (!anonymousId) {
      return { status: 'no-session', message: 'No anonymous session found' }
    }
    
    const info = {
      status: 'active',
      anonymousId,
      sessionAnonymousId,
      createdAt: createdAt ? new Date(parseInt(createdAt)).toISOString() : 'unknown',
      ageInHours: createdAt ? (Date.now() - parseInt(createdAt)) / (1000 * 60 * 60) : null,
      sessionMatches: anonymousId === sessionAnonymousId
    }
    
    console.log('📊 Anonymous Session Info:', info)
    return info
  }

  /**
   * Debug utility to reset anonymous session (forces new anonymous user creation)
   */
  resetAnonymousSession() {
    console.log('🔄 Resetting anonymous session...')
    localStorage.removeItem('hellafocused-anonymous-user-id')
    localStorage.removeItem('hellafocused-anonymous-created-at')
    sessionStorage.removeItem('previous-anonymous-user-id')
    console.log('✅ Anonymous session reset. Next auth will create new anonymous user.')
  }

  /**
   * Sets current user ID and handles auth state changes
   */
  setCurrentUser(userId: string | null) {
    const currentUserId = useSyncStore.getState().currentUserId
    
    // If user changed, cleanup old subscriptions and setup new ones
    if (currentUserId !== userId) {
      useSyncStore.getState().setCurrentUserId(userId)
      
      // Clean up existing subscriptions
      this.realtimeSubscriptions.forEach(subscription => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe()
        }
      })
      this.realtimeSubscriptions = []
      
      // If user signed out (became null), sign in anonymously
      if (!userId && currentUserId) {
        console.log('🔄 User signed out, transitioning to anonymous session...')
        
        this.ensureAuthenticated().then(async () => {
          const { data: { user } } = await supabase.auth.getUser()
          useSyncStore.getState().setCurrentUserId(user?.id || null)
          
          if (user?.id) {
            this.setupRealtimeSync()
            console.log('✅ Anonymous session established after logout')
          }
        }).catch(error => {
          console.error('❌ Failed to sign in anonymously after sign out:', error)
        })
      } else if (userId) {
        // Setup new subscriptions if user is logged in
        this.setupRealtimeSync()
      }
    }
  }

  /**
   * Clears all local state including app data but preserves pending changes.
   * Should be called when logging out to ensure clean state for next user.
   */
  clearAllLocalState() {
    try {
      // Clear app store data
      useAppStore.getState().clearLocalState()
      
      // Clear sync store data but preserve pending changes
      useSyncStore.getState().clearSyncState()
      
      // Stop any ongoing sync operations
      this.cleanup()
    } catch (error) {
      console.error('❌ Error clearing local state:', error)
    }
  }
}

// Global sync engine instance
export const syncEngine = new SyncEngine()

// Expose debug utilities globally for console access
if (typeof window !== 'undefined') {
  interface HellafocusedDebug {
    getAnonymousSessionInfo: () => ReturnType<typeof syncEngine.getAnonymousSessionInfo>
    resetAnonymousSession: () => void
    getCurrentUser: () => Promise<User | null>
    syncEngine: typeof syncEngine
  }
  
  (window as typeof window & { hellafocusedDebug: HellafocusedDebug }).hellafocusedDebug = {
    getAnonymousSessionInfo: () => syncEngine.getAnonymousSessionInfo(),
    resetAnonymousSession: () => syncEngine.resetAnonymousSession(),
    getCurrentUser: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user)
      return user
    },
    syncEngine
  }
  console.log('🔧 Debug utilities available at window.hellafocusedDebug')
} 