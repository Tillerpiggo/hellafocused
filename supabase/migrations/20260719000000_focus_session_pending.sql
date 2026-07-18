alter table public.focus_sessions rename column timer_end_time to remind_at;
alter table public.focus_sessions rename column timer_fired to reminder_fired;

alter table public.focus_sessions
  add column if not exists pending boolean not null default false;
alter table public.focus_sessions
  add column if not exists pending_reason text not null default '';

-- Sessions with an active or fired reminder were implicitly waiting on something
update public.focus_sessions
  set pending = true
  where remind_at is not null or reminder_fired = true;
