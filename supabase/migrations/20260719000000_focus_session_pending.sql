do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'focus_sessions'
      and column_name = 'timer_end_time'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'focus_sessions'
      and column_name = 'remind_at'
  ) then
    alter table public.focus_sessions rename column timer_end_time to remind_at;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'focus_sessions'
      and column_name = 'timer_fired'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'focus_sessions'
      and column_name = 'reminder_fired'
  ) then
    alter table public.focus_sessions rename column timer_fired to reminder_fired;
  end if;
end
$$;

alter table public.focus_sessions
  add column if not exists remind_at bigint null;
alter table public.focus_sessions
  add column if not exists reminder_fired boolean not null default false;
alter table public.focus_sessions
  add column if not exists pending boolean not null default false;
alter table public.focus_sessions
  add column if not exists pending_reason text not null default '';

-- Sessions with an active or fired reminder were implicitly waiting on something
update public.focus_sessions
  set pending = true
  where remind_at is not null or reminder_fired = true;
