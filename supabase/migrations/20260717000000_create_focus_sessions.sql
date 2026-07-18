create table if not exists public.focus_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_path jsonb not null default '[]'::jsonb,
  browse_path jsonb not null default '[]'::jsonb,
  view text not null default 'focus' check (view in ('focus', 'browse')),
  current_focus_task_id uuid null,
  completed_count integer not null default 0,
  timer_end_time bigint null,
  timer_fired boolean not null default false,
  position integer not null default 0,
  device_id text null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists focus_sessions_user_position_idx
  on public.focus_sessions(user_id, position)
  where is_deleted = false;

alter table public.focus_sessions enable row level security;

drop policy if exists "Users can read their focus sessions" on public.focus_sessions;
create policy "Users can read their focus sessions"
  on public.focus_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their focus sessions" on public.focus_sessions;
create policy "Users can create their focus sessions"
  on public.focus_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their focus sessions" on public.focus_sessions;
create policy "Users can update their focus sessions"
  on public.focus_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.focus_sessions;
