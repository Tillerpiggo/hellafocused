
# Supabase Sync Integration Plan

## 1. Data Flow Architecture

### Current Architecture (Before)

```
UI Components
    ↓
useAppStore (zustand/immer)
    ↓
localStorage (via persist middleware)

```

### New Architecture (After)

```
UI Components
    ↓
useAppStore (unchanged API)
    ↓
├── localStorage (via persist)
└── SyncInterceptor
        ↓
    SyncQueue (separate store)
        ↓
    SyncEngine
        ↓
    Supabase Cloud
        ↑
    Real-time Subscriptions

```

## 2. Major Classes and Responsibilities

### SyncQueue Store

-   **Purpose**: Track all pending sync operations
-   **Responsibilities**:
    -   Store pending changes with metadata
    -   Track sync status per operation
    -   Handle retry counts and errors
    -   Persist sync queue to localStorage

### SyncEngine

-   **Purpose**: Manage all cloud synchronization
-   **Responsibilities**:
    -   Execute sync operations (immediate & periodic)
    -   Handle batch operations for efficiency
    -   Manage real-time subscriptions
    -   Resolve conflicts between devices
    -   Clean up orphaned tasks periodically

### SyncInterceptor

-   **Purpose**: Bridge between app store and sync system
-   **Responsibilities**:
    -   Intercept all store mutations
    -   Create appropriate sync operations
    -   Maintain operation ordering
    -   Handle parent-child relationships

### ConflictResolver

-   **Purpose**: Handle multi-device conflicts
-   **Responsibilities**:
    -   Detect conflicting changes
    -   Apply resolution strategy (last-write-wins for now)
    -   Handle special cases (e.g., parent deleted on one device, child added on another)

## 3. Supabase Database Structure

### Tables

#### `projects`

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  device_id TEXT,
  is_deleted BOOLEAN DEFAULT FALSE
);

```

#### `tasks`

```sql
CREATE TABLE tasks (
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
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Indexes for performance
  INDEX idx_tasks_project (project_id),
  INDEX idx_tasks_parent (parent_id),
  INDEX idx_tasks_user (user_id)
);

```

#### `sync_operations` (for debugging/audit)

```sql
CREATE TABLE sync_operations (
  id UUID PRIMARY KEY,
  operation_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  data JSONB,
  device_id TEXT NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL
);

```

### Row Level Security (RLS)

```sql
-- Users can only see/modify their own data
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

```

### Real-time Subscriptions

-   Subscribe to changes on both `projects` and `tasks` tables
-   Filter by `user_id` for security and efficiency
-   Use `updated_at` timestamps for conflict detection

## 4. Implementation Details

### Type Definitions and Core Structures

The implementation starts with clear type definitions that extend the existing types:

```typescript
type SyncActionType = 'create' | 'update' | 'delete' | 'batch';
type EntityType = 'project' | 'task';

interface SyncAction {
  id: string;
  type: SyncActionType;
  entityType: EntityType;
  entityId: string;
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  parentId?: string; // For maintaining relationships
}

interface BatchSyncAction extends SyncAction {
  type: 'batch';
  operations: SyncAction[];
}

```

### Store Integration Strategy

The existing `useAppStore` will be enhanced with a sync interceptor that wraps each mutation. The interceptor creates sync operations without changing the store's public API:

1.  **Wrapping existing actions**: Each action (like `toggleTaskCompletion`, `deleteAtPath`, etc.) will call the sync interceptor after making local changes.
    
2.  **Batch operation detection**: When operations affect multiple entities (like deleting a parent task with subtasks), the interceptor creates a single batch operation rather than individual operations.
    
3.  **Operation ordering**: The sync queue maintains operation order to ensure consistency, especially important for parent-child relationships.
    

### Sync Engine Implementation

The `SyncEngine` class handles all communication with Supabase:

1.  **Immediate sync attempts**: When a change is made, the engine immediately attempts to sync if online. This provides near-instant updates across devices when the connection is good.
    
2.  **Periodic sync**: A background process runs every 30 seconds to sync any queued operations, handling cases where immediate sync failed.
    
3.  **Batch execution**: Related operations are sent together to Supabase, reducing API calls and ensuring atomic updates where possible.
    
4.  **Offline queue management**: Operations are queued with metadata when offline, including retry counts and timestamps for later processing.
    

### Real-time Synchronization

Real-time sync uses Supabase's built-in subscriptions:

1.  **Channel setup**: On app initialization, channels are created for both the `projects` and `tasks` tables, filtered by the current user ID.
    
2.  **Echo detection**: When the local device's changes are echoed back through subscriptions, they're detected and ignored using device IDs and operation timestamps.
    
3.  **State merging**: Incoming changes from other devices are merged into the local state, with the sync system temporarily disabled to prevent echo loops.
    

### Conflict Resolution

The system handles several types of conflicts:

1.  **Simple conflicts**: When the same task is modified on two devices, the most recent change (by timestamp) wins.
    
2.  **Structural conflicts**: If a parent is deleted on one device while children are added on another, the system resolves by either recreating the parent or moving orphaned children to the root level.
    
3.  **Completion date ordering**: Since tasks are ordered by completion date, conflicts in ordering resolve naturally without special handling.
    

### Data Migration and Initial Sync

When first connecting to Supabase:

1.  **Initial push**: All existing local data is pushed to Supabase in batches, with projects created before their tasks to maintain referential integrity.
    
2.  **Conflict handling**: If data already exists in Supabase (from another device), a merge strategy is applied where local data takes precedence for the first sync.
    
3.  **Subscription activation**: Only after initial sync completes do real-time subscriptions activate to prevent conflicts during migration.
    

### Error Handling and Recovery

The system includes multiple layers of error handling:

1.  **Retry logic**: Failed operations are retried with exponential backoff (1s, 2s, 4s, etc.) up to a maximum number of attempts.
    
2.  **Partial batch failures**: If part of a batch fails, the system can split it into individual operations and retry separately.
    
3.  **Corruption prevention**: All data is validated before syncing, and corrupted operations are quarantined rather than retried indefinitely.
    
4.  **Orphan cleanup**: A periodic process identifies tasks whose parents no longer exist and either deletes them or moves them to appropriate locations.
    

### Maintaining Current API

The integration carefully preserves the existing store API:

1.  **No changes to component code**: UI components continue using the same store methods and selectors.
    
2.  **Internal additions only**: New functionality is added through internal methods (prefixed with `_`) or separate stores.
    
3.  **Transparent sync**: The sync layer operates invisibly unless explicitly queried through status hooks.
    

This implementation provides robust multi-device synchronization while maintaining the simplicity and reliability of the existing local-first approach. The system gracefully handles offline usage, network failures, and device conflicts while keeping the user experience smooth and responsive.