import { supabase, DatabaseProject, DatabaseTask } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export class DatabaseTester {
  private testUserId = uuidv4() // Generate a proper UUID for user_id
  private testDeviceId = 'test-device-' + Math.random().toString(36).substr(2, 9)
  private client = supabase
  private testEmail = `test-${Math.random().toString(36).substr(2, 9)}@gmail.com`
  private testPassword = 'test-password-123'

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔌 Testing Supabase connection...')
      const { data, error } = await this.client.from('projects').select('count', { count: 'exact' })
      
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

  async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 Setting up authentication...')
      
      // First try anonymous authentication (simpler for testing)
      console.log('  → Trying anonymous authentication...')
      const { data: anonData, error: anonError } = await this.client.auth.signInAnonymously()
      
      if (!anonError && anonData.user) {
        this.testUserId = anonData.user.id
        console.log('  ✅ Anonymous authentication successful! User ID:', this.testUserId)
        return true
      }

      console.log('  → Anonymous auth not available, trying email signup...')
      
      // Fall back to email authentication
      console.log('  → Creating test user:', this.testEmail)
      const { data: signUpData, error: signUpError } = await this.client.auth.signUp({
        email: this.testEmail,
        password: this.testPassword,
      })

      if (signUpError && !signUpError.message.includes('already registered')) {
        console.error('❌ Sign up failed:', signUpError.message)
        console.log('💡 Tip: Make sure "Enable new user signups" is turned ON in your Supabase Authentication settings')
        return false
      }

      // If user already exists or signup succeeded, try to sign in
      console.log('  → Signing in...')
      const { data: signInData, error: signInError } = await this.client.auth.signInWithPassword({
        email: this.testEmail,
        password: this.testPassword,
      })

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          console.error('❌ Sign in failed: Email not confirmed')
          console.log('💡 Solution: In your Supabase Dashboard → Authentication → Settings:')
          console.log('   - Disable "Enable email confirmations" for testing')
          console.log('   - OR enable "Allow anonymous sign-ins" for simpler testing')
        } else {
          console.error('❌ Sign in failed:', signInError.message)
        }
        return false
      }

      if (signInData.user) {
        this.testUserId = signInData.user.id // Use the actual authenticated user ID
        console.log('  ✅ Email authentication successful! User ID:', this.testUserId)
        return true
      }

      console.error('❌ Authentication failed: No user returned')
      return false
    } catch (error) {
      console.error('❌ Authentication error:', error)
      return false
    }
  }

  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up authentication...')
      await this.client.auth.signOut()
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error)
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
      const { data: createData, error: createError } = await this.client
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
      const { data: readData, error: readError } = await this.client
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
      const { data: updateData, error: updateError } = await this.client
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
      const { data: deleteData, error: deleteError } = await this.client
        .from('projects')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', testProject.id)

      if (deleteError) {
        console.error('❌ Project soft delete failed:', deleteError.message)
        return false
      }

      console.log('  ✅ Project soft deleted successfully')

      // Cleanup - hard delete
      await this.client.from('projects').delete().eq('id', testProject.id)

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

      const { data: projectData, error: projectError } = await this.client
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
      const { data: createData, error: createError } = await this.client
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
      const { data: readData, error: readError } = await this.client
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
      const { data: updateData, error: updateError } = await this.client
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
      const { data: childData, error: childError } = await this.client
        .from('tasks')
        .insert(childTask)
        .select()

      if (childError) {
        console.error('❌ Child task creation failed:', childError.message)
        return false
      }

      console.log('  ✅ Child task created successfully')

      // Cleanup
      await this.client.from('tasks').delete().eq('project_id', testProject.id)
      await this.client.from('projects').delete().eq('id', testProject.id)

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
    const authTest = await this.authenticate()
    if (!authTest) {
      console.log('\n❌ Database tests failed - authentication issue')
      return false
    }

    console.log()
    const projectTest = await this.testProjectOperations()
    
    console.log()
    const taskTest = await this.testTaskOperations()

    // Cleanup
    await this.cleanup()

    const allPassed = connectionTest && authTest && projectTest && taskTest
    
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