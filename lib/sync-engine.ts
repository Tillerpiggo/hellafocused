import { supabase, type DatabaseProject, type DatabaseTask } from './supabase'
import { useSyncStore } from '@/store/sync-store'
import { useAppStore } from '@/store/app-store'
import type { ProjectData, TaskItemData } from './types'

// Fake UUID for anonymous user (consistent across the app)
const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000'

class SyncEngine {
  private syncInterval: NodeJS.Timeout | null = null

  async init() {
    console.log(`🚀 SyncEngine.init() called`)
    try {
      // 1. Load persisted local data (happens automatically via zustand persist)
      console.log(`🚀 Step 1: Local data loaded automatically`)
      
      // 2. Sync any pending changes from last session
      console.log(`🚀 Step 2: Syncing pending changes...`)
      await this.syncPendingChanges()
      
      // 3. Fetch latest data from Supabase and merge
      console.log(`🚀 Step 3: Merging with cloud...`)
      await this.mergeWithCloud()
      
      // 4. Start periodic sync
      console.log(`🚀 Step 4: Starting periodic sync...`)
      this.startPeriodicSync()
      
      // 5. Setup real-time sync
      console.log(`🚀 Step 5: Setting up real-time sync...`)
      this.setupRealtimeSync()
      
      console.log('✅ Sync initialized successfully')
    } catch (error) {
      console.error('❌ Sync initialization error:', error)
    }
  }

  async syncSingleChange(id: string): Promise<boolean> {
    console.log(`🔧 SyncEngine.syncSingleChange called for ID: ${id}`)
    
    if (!navigator.onLine) {
      console.log(`🔧 Browser is offline, skipping sync for ${id}`)
      return false
    }

    console.log(`🔧 Getting pending change for ID: ${id}`)
    const change = useSyncStore.getState().pendingChanges[id]
    if (!change || change.synced) {
      console.log(`🔧 Change ${id} not found or already synced`)
      return true
    }

    console.log(`🔧 Processing change:`, change)

    try {
      switch (change.type) {
        case 'create':
          console.log(`🔧 Processing CREATE for ${change.entityType}`)
          if (change.entityType === 'project') {
            await this.createProject(change.data as ProjectData)
          } else if (change.entityType === 'task') {
            await this.createTask(change.data as TaskItemData, change.projectId!, change.parentId)
          }
          break
        case 'update':
          console.log(`🔧 Processing UPDATE for ${change.entityType}`)
          if (change.entityType === 'project') {
            await this.updateProject(change.entityId, change.data as ProjectData)
          } else if (change.entityType === 'task') {
            await this.updateTask(change.entityId, change.data as TaskItemData)
          }
          break
        case 'delete':
          console.log(`🔧 Processing DELETE for ${change.entityType}`)
          if (change.entityType === 'project') {
            await this.deleteProject(change.entityId)
          } else if (change.entityType === 'task') {
            await this.deleteTask(change.entityId)
          }
          break
      }

      console.log(`🔧 Successfully processed change ${id}, marking as synced`)
      // Mark as synced
      useSyncStore.getState().markSynced(id)
      return true
    } catch (error) {
      console.error('Sync error for change', id, ':', error)
      // Track error for debugging
      useSyncStore.getState().markFailed(id, error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  async syncPendingChanges() {
    const { pendingChanges } = useSyncStore.getState()
    const pending = Object.entries(pendingChanges)
      .filter(([_, change]) => !change.synced)
      .sort((a, b) => a[1].timestamp - b[1].timestamp) // Sync in order

    console.log(`📤 Syncing ${pending.length} pending changes`)

    for (const [id] of pending) {
      await this.syncSingleChange(id)
    }

    // Clean up synced changes
    useSyncStore.getState().removeSynced()
    useSyncStore.getState().updateLastSyncedAt()
  }

  async mergeWithCloud() {
    try {
      console.log('🔄 Merging with cloud data...')
      
      // Fetch projects and tasks from Supabase
      const { data: cloudProjects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', ANONYMOUS_USER_ID)
        .eq('is_deleted', false)

      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
        return
      }

      const { data: cloudTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', ANONYMOUS_USER_ID)
        .eq('is_deleted', false)

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError)
        return
      }

      if (cloudProjects && cloudTasks) {
        const convertedProjects = this.convertCloudToLocal(cloudProjects, cloudTasks)
        
        // Simple merge strategy: if we have no local data, use cloud data
        const localProjects = useAppStore.getState().projects
        if (localProjects.length === 0 && convertedProjects.length > 0) {
          console.log(`📥 Loading ${convertedProjects.length} projects from cloud`)
          useAppStore.setState({ projects: convertedProjects })
        }
      }
    } catch (error) {
      // Continue with local data if cloud fetch fails
      console.error('Cloud merge failed:', error)
    }
  }

  private startPeriodicSync() {
    // Sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        await this.syncPendingChanges()
      }
    }, 30000)
  }

  private setupRealtimeSync() {
    // TODO: Implement real-time updates from other devices
    console.log('📡 Real-time sync would be set up here')
  }

  // Database operations
  private async createProject(project: ProjectData) {
    const { error } = await supabase.from('projects').insert({
      id: project.id,
      name: project.name,
      user_id: ANONYMOUS_USER_ID,
      device_id: useSyncStore.getState().deviceId,
      is_deleted: false,
    })

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`)
    }

    console.log(`✅ Created project: ${project.name}`)
  }

  private async updateProject(projectId: string, project: ProjectData) {
    const { error } = await supabase
      .from('projects')
      .update({
        name: project.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', ANONYMOUS_USER_ID)

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`)
    }

    console.log(`✅ Updated project: ${project.name}`)
  }

  private async deleteProject(projectId: string) {
    const { error } = await supabase
      .from('projects')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', ANONYMOUS_USER_ID)

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`)
    }

    console.log(`✅ Deleted project: ${projectId}`)
  }

  private async createTask(task: TaskItemData, projectId: string, parentId?: string) {
    const { error } = await supabase.from('tasks').insert({
      id: task.id,
      name: task.name,
      project_id: projectId,
      parent_id: parentId || null,
      completed: task.completed,
      completion_date: task.completionDate || null,
      position: 0, // TODO: Calculate proper position
      user_id: ANONYMOUS_USER_ID,
      device_id: useSyncStore.getState().deviceId,
      is_deleted: false,
    })

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    console.log(`✅ Created task: ${task.name}`)
  }

  private async updateTask(taskId: string, task: TaskItemData) {
    const { error } = await supabase
      .from('tasks')
      .update({
        name: task.name,
        completed: task.completed,
        completion_date: task.completionDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('user_id', ANONYMOUS_USER_ID)

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }

    console.log(`✅ Updated task: ${task.name}`)
  }

  private async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('user_id', ANONYMOUS_USER_ID)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }

    console.log(`✅ Deleted task: ${taskId}`)
  }

  private convertCloudToLocal(cloudProjects: DatabaseProject[], cloudTasks: DatabaseTask[]): ProjectData[] {
    // Convert Supabase format to local app format
    return cloudProjects.map(cloudProject => {
      // Find all tasks that belong to this project (at root level)
      const projectTasks = cloudTasks
        .filter(task => task.project_id === cloudProject.id && !task.parent_id)
        .map(task => this.convertTaskToLocal(task, cloudTasks))

      return {
        id: cloudProject.id,
        name: cloudProject.name,
        tasks: projectTasks,
      }
    })
  }

  private convertTaskToLocal(cloudTask: DatabaseTask, allTasks: DatabaseTask[]): TaskItemData {
    // Find all subtasks of this task
    const subtasks = allTasks
      .filter(task => task.parent_id === cloudTask.id)
      .map(task => this.convertTaskToLocal(task, allTasks))

    return {
      id: cloudTask.id,
      name: cloudTask.name,
      completed: cloudTask.completed,
      completionDate: cloudTask.completion_date || undefined,
      subtasks,
    }
  }

  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }
}

// Global sync engine instance
export const syncEngine = new SyncEngine() 