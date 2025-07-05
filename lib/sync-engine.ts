import { supabase, type DatabaseProject, type DatabaseTask } from './supabase'
import { useAppStore } from '@/store/app-store'
import { useSyncStore } from '@/store/sync-store'
import { mergeManager } from './merge-manager'
import type { ProjectData, TaskData } from './types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { findTaskAtPath, findProjectAtPath, isProjectList, isProject } from './task-utils'

class SyncEngine {
  private syncInterval: NodeJS.Timeout | null = null
  private realtimeSubscriptions: ReturnType<typeof supabase.channel>[] = []
  private instanceId: string = `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

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
      const { data: { user } } = await supabase.auth.getUser()
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
    console.log("ensuring authenticated")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Don't auto-sign in anonymously on auth pages
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/')) {
        console.log('🔄 Skipping anonymous sign-in on auth page:', window.location.pathname)
        return
      }
      
      console.log("signing in anonymously")
      const { data, error } = await supabase.auth.signInAnonymously()
      console.log("signed in anonymously", data, error)
      
      if (error) {
        throw new Error(`Failed to sign in anonymously: ${error.message}`)
      }
      
      if (data.user?.id) {
        // Store the anonymous user ID for potential future migration
        sessionStorage.setItem('previous-anonymous-user-id', data.user.id)
        
        // Sync pending changes and merge with cloud after successful sign-in
        await this.syncPendingChanges()
        await this.mergeWithCloud()
      }
    } else {
      // If this is a real (non-anonymous) user, we can clear any stored anonymous ID
      // since they're already authenticated and any migration would have happened
      if (!user.is_anonymous) {
        const storedAnonymousId = sessionStorage.getItem('previous-anonymous-user-id')
        if (storedAnonymousId && storedAnonymousId !== user.id) {
          sessionStorage.removeItem('previous-anonymous-user-id')
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

  async syncPendingChanges() {
    const { pendingChanges, currentUserId } = useSyncStore.getState()
    
    // No user logged in, don't sync anything
    if (!currentUserId) {
      return
    }
    
    // Filter for current user's unsynced changes
    const pending = Object.entries(pendingChanges)
      .filter(([, change]) => !change.synced && change.userId === currentUserId)
      .sort((a, b) => a[1].timestamp - b[1].timestamp) // Sync in order

    for (const [id] of pending) {
      await this.syncSingleChange(id)
      console.log('🔄 Syncing change', id)
    }

    // Clean up synced changes
    useSyncStore.getState().removeSynced()
    useSyncStore.getState().updateLastSyncedAt()
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
    
    const { error } = await supabase.from('tasks').insert({
      id: task.id,
      name: task.name,
      project_id: projectId,
      parent_id: parentId || null,
      completed: task.completed,
      completion_date: task.completionDate || null,
      position: 0, // TODO: Calculate proper position
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
        console.log('🔄 User signed out, signing in anonymously...')
        this.ensureAuthenticated().then(async () => {
          const { data: { user } } = await supabase.auth.getUser()
          useSyncStore.getState().setCurrentUserId(user?.id || null)
          
          if (user?.id) {
            this.setupRealtimeSync()
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