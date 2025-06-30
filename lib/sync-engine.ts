import { supabase } from './supabase'
import { useSyncStore } from '@/store/sync-store'
import { useAppStore } from '@/store/app-store'
import type { ProjectData, TaskItemData } from './types'

class SyncEngine {
  private isInitialized = false
  private syncInterval: NodeJS.Timeout | null = null

  async init() {
    try {
      // 1. Load persisted local data (happens automatically via zustand persist)
      
      // 2. Sync any pending changes from last session
      await this.syncPendingChanges()
      
      // 3. Fetch latest data from Supabase and merge
      await this.mergeWithCloud()
      
      // 4. Start periodic sync
      this.startPeriodicSync()
      
      // 5. Setup real-time sync
      this.setupRealtimeSync()
      
      this.isInitialized = true
      console.log('✅ Sync initialized successfully')
    } catch (error) {
      console.error('❌ Sync initialization error:', error)
    }
  }

  async syncSingleChange(id: string): Promise<boolean> {
    if (!navigator.onLine) return false

    const change = useSyncStore.getState().pendingChanges[id]
    if (!change || change.synced) return true

    try {
      const { entityType, entityId, data } = this.parseChangeData(change)

      switch (change.type) {
        case 'create':
          if (entityType === 'project') {
            await this.createProject(data)
          } else if (entityType === 'task') {
            await this.createTask(data)
          }
          break
        case 'update':
          if (entityType === 'project') {
            await this.updateProject(entityId, data)
          } else if (entityType === 'task') {
            await this.updateTask(entityId, data)
          }
          break
        case 'delete':
          if (entityType === 'project') {
            await this.deleteProject(entityId)
          } else if (entityType === 'task') {
            await this.deleteTask(entityId)
          }
          break
      }

      // Mark as synced
      useSyncStore.getState().markSynced(id)
      return true
    } catch (error) {
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

    for (const [id] of pending) {
      await this.syncSingleChange(id)
    }

    // Clean up synced changes
    useSyncStore.getState().removeSynced()
    useSyncStore.getState().updateLastSyncedAt()
  }

  async mergeWithCloud() {
    try {
      // TODO: Implement simple merge strategy
      // For now, just fetch from cloud if no local data
      const localProjects = useAppStore.getState().projects
      
      if (localProjects.length === 0) {
        // No local data, fetch from cloud
        const { data: cloudProjects } = await supabase.from('projects').select('*')
        const { data: cloudTasks } = await supabase.from('tasks').select('*')
        
        if (cloudProjects && cloudTasks) {
          const convertedProjects = this.convertCloudToLocal(cloudProjects, cloudTasks)
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
    // For now, just log that we would set this up
    console.log('📡 Real-time sync would be set up here')
  }

  // Database operations
  private async createProject(project: ProjectData) {
    await supabase.from('projects').insert({
      id: project.id,
      name: project.name,
      user_id: 'anonymous-user', // TODO: Get real user ID
      device_id: useSyncStore.getState().deviceId,
      is_deleted: false,
    })
  }

  private async updateProject(projectId: string, project: ProjectData) {
    await supabase
      .from('projects')
      .update({
        name: project.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
  }

  private async deleteProject(projectId: string) {
    await supabase
      .from('projects')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
  }

  private async createTask(task: TaskItemData & { projectId: string, parentId?: string }) {
    await supabase.from('tasks').insert({
      id: task.id,
      name: task.name,
      project_id: task.projectId,
      parent_id: task.parentId || null,
      completed: task.completed,
      completion_date: task.completionDate?.toISOString() || null,
      position: 0,
      user_id: 'anonymous-user', // TODO: Get real user ID
      device_id: useSyncStore.getState().deviceId,
      is_deleted: false,
    })
  }

  private async updateTask(taskId: string, task: TaskItemData) {
    await supabase
      .from('tasks')
      .update({
        name: task.name,
        completed: task.completed,
        completion_date: task.completionDate?.toISOString() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
  }

  private async deleteTask(taskId: string) {
    await supabase
      .from('tasks')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
  }

  // Helper methods
  private parseChangeData(change: any): { entityType: string, entityId: string, data: any } {
    // Simple parsing - adjust based on how you structure the change data
    return {
      entityType: change.data.entityType || 'project',
      entityId: change.data.id || change.id,
      data: change.data,
    }
  }

  private convertCloudToLocal(cloudProjects: any[], cloudTasks: any[]): ProjectData[] {
    // TODO: Convert cloud format to local format
    return []
  }

  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.isInitialized = false
  }
}

// Global sync engine instance
export const syncEngine = new SyncEngine() 