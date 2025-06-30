import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables first
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables (based on the schema in the design doc)
export interface DatabaseProject {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
  device_id?: string
  is_deleted: boolean
}

export interface DatabaseTask {
  id: string
  name: string
  project_id: string
  parent_id?: string
  completed: boolean
  completion_date?: string
  position: number
  user_id: string
  created_at: string
  updated_at: string
  device_id?: string
  is_deleted: boolean
} 