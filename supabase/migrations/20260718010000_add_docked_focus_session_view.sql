alter table public.focus_sessions
  drop constraint if exists focus_sessions_view_check;

alter table public.focus_sessions
  add constraint focus_sessions_view_check
  check (view in ('focus', 'docked', 'browse'));
