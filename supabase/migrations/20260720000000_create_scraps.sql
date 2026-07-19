create table if not exists public.scraps (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  device_id text null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scraps_user_created_idx
  on public.scraps(user_id, created_at)
  where is_deleted = false;

alter table public.scraps enable row level security;

drop policy if exists "Users can read their scraps" on public.scraps;
create policy "Users can read their scraps"
  on public.scraps for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their scraps" on public.scraps;
create policy "Users can create their scraps"
  on public.scraps for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their scraps" on public.scraps;
create policy "Users can update their scraps"
  on public.scraps for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.scraps;
