-- Fixes found in review. Safe to run once on a database that already has 0001 and 0002.

-- ───────────────────────── New-user bootstrap ─────────────────────────
-- `band in (...)` is NULL when age_band is missing (every Google sign-up), and NULL into the
-- not-null age_confirmed column made the whole signup fail with "Database error saving new user".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta    jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  band    text  := meta->>'age_band';
  consent boolean := lower(coalesce(meta->>'parent_consent', '')) in ('true', 't', '1', 'yes');
  valid   boolean := coalesce(band in ('UNDER_13', 'TEEN_13_17', 'ADULT_18_24', 'ADULT_25_PLUS'), false);
begin
  -- Age rules are enforced here, not just in the UI (signUp is callable with the public anon key).
  if band = 'UNDER_13' then
    raise exception 'FinPlay is for ages 13 and up';
  end if;
  if band = 'TEEN_13_17' and not consent then
    raise exception 'A parent or guardian must agree before a 13–17 year old signs up';
  end if;

  insert into public.profiles (id, display_name, avatar_url, age_band, parent_consent, age_confirmed)
  values (
    new.id,
    left(coalesce(nullif(trim(meta->>'display_name'), ''), nullif(trim(meta->>'full_name'), ''), nullif(trim(meta->>'name'), ''),
                  nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Player'), 40),
    meta->>'avatar_url',
    case when valid then band::age_band else 'ADULT_18_24'::age_band end,
    consent,
    valid
  );
  insert into public.user_settings (user_id) values (new.id);
  insert into public.player_progress (user_id) values (new.id);
  insert into public.wallets (user_id) values (new.id);
  insert into public.wallet_txns (user_id, amount, type, reason) values (new.id, 100000, 'CREDIT', 'Welcome bonus');
  return new;
end;
$$;

-- ───────────────────────── Lock down direct access ─────────────────────────
-- The app reads leaderboards and writes profiles/feedback through its API with the service role,
-- so the public anon key doesn't need these. Left open, they let anyone list every player
-- (including 13–17 year olds), set an arbitrary avatar URL, or spam feedback past the rate limit.
revoke execute on function public.leaderboard_weekly_xp(int) from anon, authenticated, public;
revoke execute on function public.leaderboard_game(text, int) from anon, authenticated, public;
grant execute on function public.leaderboard_weekly_xp(int) to service_role;
grant execute on function public.leaderboard_game(text, int) to service_role;

revoke update (avatar_url) on public.profiles from authenticated;

drop policy if exists "anyone feedback insert" on public.feedback;
