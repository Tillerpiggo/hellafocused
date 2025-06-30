# Database Tests

This directory contains simple test classes to validate the Supabase database connection and basic operations.

## Setup

1. Create a `.env.local` file in the project root with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Make sure your Supabase project has the following tables set up:
   - `projects` table with the schema from the design doc
   - `tasks` table with the schema from the design doc
   - Row Level Security (RLS) policies configured

## Running Tests

Run the database tests with:

```bash
npm run test:db
```

## What the Tests Do

The tests will:

1. **Connection Test**: Verify that the app can connect to your Supabase database
2. **Project Operations**: Test creating, reading, updating, and soft-deleting projects
3. **Task Operations**: Test creating, reading, updating tasks, including parent-child relationships

## Expected Output

If everything is working correctly, you should see output like:

```
🚀 Starting database tests...

🔌 Testing Supabase connection...
✅ Connection successful!

📁 Testing project operations...
  → Creating project: Test Project 1234567890
  ✅ Project created successfully
  → Reading project...
  ✅ Project read successfully: Test Project 1234567890
  → Updating project name to: Updated Test Project 1234567890
  ✅ Project updated successfully
  → Soft deleting project...
  ✅ Project soft deleted successfully
✅ All project operations completed successfully!

📋 Testing task operations...
  → Creating task: Test Task 1234567890
  ✅ Task created successfully
  → Reading task...
  ✅ Task read successfully: Test Task 1234567890
  → Completing task...
  ✅ Task completed successfully
  → Creating child task...
  ✅ Child task created successfully
✅ All task operations completed successfully!

==================================================
🎉 All database tests passed! Supabase is working correctly.
==================================================
```

## After Testing

Once the tests pass, you can delete this entire `test/` directory as these are just temporary validation files. The real implementation will be integrated into the existing store system. 