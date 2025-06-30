-- Supabase database schema for hellafocused sync system
-- Designed to work with anonymous users now and real auth later

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  device_id TEXT,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completion_date TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  device_id TEXT,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_device ON projects(device_id);
CREATE INDEX IF NOT EXISTS idx_tasks_device ON tasks(device_id);

-- Optional: Sync operations table for debugging/audit
CREATE TABLE IF NOT EXISTS sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  data JSONB,
  device_id TEXT NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL
);

-- User profiles table (for future real authentication)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  anonymous_user_id UUID, -- Link anonymous data to real user when they sign up
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;


-- Projects policies
CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (
    -- Allow current user (anonymous or authenticated)
    user_id = auth.uid()
    OR
    -- Allow authenticated users to access their previous anonymous data
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND anonymous_user_id = user_id
    ))
  );

-- Tasks policies  
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (
    -- Allow current user (anonymous or authenticated)
    user_id = auth.uid()
    OR
    -- Allow authenticated users to access their previous anonymous data
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND anonymous_user_id = user_id
    ))
  );

-- Sync operations policies
CREATE POLICY "Users can manage own sync operations" ON sync_operations
  FOR ALL USING (
    -- Allow current user (anonymous or authenticated)
    user_id = auth.uid()
    OR
    -- Allow authenticated users to access their previous anonymous data
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND anonymous_user_id = user_id
    ))
  );

-- User profiles policies (for future)
CREATE POLICY "Users can view and edit own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- Update triggers to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to migrate anonymous user data to authenticated user
-- Called when a user upgrades from anonymous to real authentication
CREATE OR REPLACE FUNCTION migrate_anonymous_data_to_user(
  authenticated_user_id UUID,
  anonymous_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Create or update user profile with anonymous link
  INSERT INTO user_profiles (id, anonymous_user_id)
  VALUES (authenticated_user_id, anonymous_user_id)
  ON CONFLICT (id) DO UPDATE SET
    anonymous_user_id = EXCLUDED.anonymous_user_id,
    updated_at = NOW();
  
  -- Migrate projects
  UPDATE projects 
  SET user_id = authenticated_user_id, updated_at = NOW()
  WHERE user_id = anonymous_user_id;
  
  -- Migrate tasks  
  UPDATE tasks
  SET user_id = authenticated_user_id, updated_at = NOW()
  WHERE user_id = anonymous_user_id;
  
  -- Migrate sync operations
  UPDATE sync_operations
  SET user_id = authenticated_user_id
  WHERE user_id = anonymous_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON projects TO anon, authenticated;
GRANT ALL ON tasks TO anon, authenticated;
GRANT ALL ON sync_operations TO anon, authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_anonymous_data_to_user TO authenticated; 