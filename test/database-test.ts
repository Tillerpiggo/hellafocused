import { supabase, DatabaseProject, DatabaseTask } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export class DatabaseTester {
  private testUserId = 'test-user-' + Math.random().toString(36).substr(2, 9)
  private testDeviceId = 'test-device-' + Math.random().toString(36).substr(2, 9)

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔌 Testing Supabase connection...')
      const { data, error } = await supabase.from('projects').select('count', { count: 'exact' })
      
      if (error) {
        console.error('❌ Connection failed:', error.message)
        return false
      }
      
      console.log('✅ Connection successful!')
      return true
    } catch (error) {
      console.error('❌ Connection error:', error)
      return false
    }
  }

  async testProjectOperations(): Promise<boolean> {
    try {
      console.log('📁 Testing project operations...')
      
      // Create test project
      const testProject: Omit<DatabaseProject, 'created_at' | 'updated_at'> = {
        id: uuidv4(),
        name: 'Test Project ' + Date.now(),
        user_id: this.testUserId,
        device_id: this.testDeviceId,
        is_deleted: false
      }

      console.log('  → Creating project:', testProject.name)
      const { data: createData, error: createError } = await supabase
        .from('projects')
        .insert(testProject)
        .select()

      if (createError) {
        console.error('❌ Project creation failed:', createError.message)
        return false
      }

      console.log('  ✅ Project created successfully')

      // Read project
      console.log('  → Reading project...')
      const { data: readData, error: readError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', testProject.id)
        .single()

      if (readError) {
        console.error('❌ Project read failed:', readError.message)
        return false
      }

      console.log('  ✅ Project read successfully:', readData.name)

      // Update project
      const updatedName = 'Updated Test Project ' + Date.now()
      console.log('  → Updating project name to:', updatedName)
      const { data: updateData, error: updateError } = await supabase
        .from('projects')
        .update({ name: updatedName, updated_at: new Date().toISOString() })
        .eq('id', testProject.id)
        .select()

      if (updateError) {
        console.error('❌ Project update failed:', updateError.message)
        return false
      }

      console.log('  ✅ Project updated successfully')

      // Delete project (soft delete)
      console.log('  → Soft deleting project...')
      const { data: deleteData, error: deleteError } = await supabase
        .from('projects')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', testProject.id)

      if (deleteError) {
        console.error('❌ Project soft delete failed:', deleteError.message)
        return false
      }

      console.log('  ✅ Project soft deleted successfully')

      // Cleanup - hard delete
      await supabase.from('projects').delete().eq('id', testProject.id)

      console.log('✅ All project operations completed successfully!')
      return true

    } catch (error) {
      console.error('❌ Project operations error:', error)
      return false
    }
  }

  async testTaskOperations(): Promise<boolean> {
    try {
      console.log('📋 Testing task operations...')

      // First create a project to hold the task
      const testProject: Omit<DatabaseProject, 'created_at' | 'updated_at'> = {
        id: uuidv4(),
        name: 'Test Project for Tasks',
        user_id: this.testUserId,
        device_id: this.testDeviceId,
        is_deleted: false
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert(testProject)
        .select()

      if (projectError) {
        console.error('❌ Failed to create test project:', projectError.message)
        return false
      }

      // Create test task
      const testTask: Omit<DatabaseTask, 'created_at' | 'updated_at'> = {
        id: uuidv4(),
        name: 'Test Task ' + Date.now(),
        project_id: testProject.id,
        completed: false,
        position: 0,
        user_id: this.testUserId,
        device_id: this.testDeviceId,
        is_deleted: false
      }

      console.log('  → Creating task:', testTask.name)
      const { data: createData, error: createError } = await supabase
        .from('tasks')
        .insert(testTask)
        .select()

      if (createError) {
        console.error('❌ Task creation failed:', createError.message)
        return false
      }

      console.log('  ✅ Task created successfully')

      // Read task
      console.log('  → Reading task...')
      const { data: readData, error: readError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', testTask.id)
        .single()

      if (readError) {
        console.error('❌ Task read failed:', readError.message)
        return false
      }

      console.log('  ✅ Task read successfully:', readData.name)

      // Update task (mark as completed)
      console.log('  → Completing task...')
      const { data: updateData, error: updateError } = await supabase
        .from('tasks')
        .update({ 
          completed: true, 
          completion_date: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', testTask.id)
        .select()

      if (updateError) {
        console.error('❌ Task update failed:', updateError.message)
        return false
      }

      console.log('  ✅ Task completed successfully')

      // Test parent-child relationship
      const childTask: Omit<DatabaseTask, 'created_at' | 'updated_at'> = {
        id: uuidv4(),
        name: 'Child Task ' + Date.now(),
        project_id: testProject.id,
        parent_id: testTask.id,
        completed: false,
        position: 0,
        user_id: this.testUserId,
        device_id: this.testDeviceId,
        is_deleted: false
      }

      console.log('  → Creating child task...')
      const { data: childData, error: childError } = await supabase
        .from('tasks')
        .insert(childTask)
        .select()

      if (childError) {
        console.error('❌ Child task creation failed:', childError.message)
        return false
      }

      console.log('  ✅ Child task created successfully')

      // Cleanup
      await supabase.from('tasks').delete().eq('project_id', testProject.id)
      await supabase.from('projects').delete().eq('id', testProject.id)

      console.log('✅ All task operations completed successfully!')
      return true

    } catch (error) {
      console.error('❌ Task operations error:', error)
      return false
    }
  }

  async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting database tests...\n')
    
    const connectionTest = await this.testConnection()
    if (!connectionTest) {
      console.log('\n❌ Database tests failed - connection issue')
      return false
    }

    console.log()
    const projectTest = await this.testProjectOperations()
    
    console.log()
    const taskTest = await this.testTaskOperations()

    const allPassed = connectionTest && projectTest && taskTest
    
    console.log('\n' + '='.repeat(50))
    if (allPassed) {
      console.log('🎉 All database tests passed! Supabase is working correctly.')
    } else {
      console.log('❌ Some database tests failed. Please check the errors above.')
    }
    console.log('='.repeat(50))

    return allPassed
  }
} 