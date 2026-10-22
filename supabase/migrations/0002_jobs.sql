-- Background jobs (replaces the BullMQ workers from the original design).

-- PAUSED/ACTIVE sessions idle for 7 days become ABANDONED.
create or replace function public.abandon_idle_sessions()
returns int
language sql security definer set search_path = public
as $$
  with closed as (
    update game_sessions
       set status = 'ABANDONED', ended_at = now()
     where status in ('ACTIVE', 'PAUSED')
       and updated_at < now() - interval '7 days'
    returning 1
  )
  select count(*)::int from closed;
$$;

revoke execute on function public.abandon_idle_sessions() from anon, authenticated, public;

-- Schedule it hourly with pg_cron (enable the extension in Dashboard → Database → Extensions first).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('abandon-idle-sessions', '0 * * * *', 'select public.abandon_idle_sessions()');
  end if;
end $$;
