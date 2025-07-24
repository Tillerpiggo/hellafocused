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

// Helper function to get the correct base URL for OAuth redirects
export function getBaseUrl(): string {
  console.log('getBaseUrl() called with:', {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: process.env.NODE_ENV,
    windowExists: typeof window !== 'undefined',
    windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
  })
  
  // In production, use the NEXT_PUBLIC_SITE_URL environment variable
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    console.log('Using NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    console.log('Using development URL: http://localhost:3000')
    return 'http://localhost:3000'
  }
  
  // Fallback to window.location.origin if available (client-side)
  if (typeof window !== 'undefined') {
    console.log('Using window.location.origin:', window.location.origin)
    return window.location.origin
  }
  
  // Production fallback to hellafocused.com
  console.log('Using production fallback: https://hellafocused.com')
  return 'https://hellafocused.com'
}

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
  priority: number
  user_id: string
  created_at: string
  updated_at: string
  device_id?: string
  is_deleted: boolean
} 