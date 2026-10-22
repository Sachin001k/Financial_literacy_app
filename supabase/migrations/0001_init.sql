-- FinPlay schema for Supabase (Postgres).
-- Content (games, lessons, quizzes, achievements, assets) lives in code under lib/content
-- and is referenced here by slug/code, so adding content needs no migration.
-- All ₹ amounts are stored in paise (integers).
-- Score, XP and wallet rows are written only by the server (service role); RLS lets users read their own.

create type age_band as enum ('UNDER_13', 'TEEN_13_17', 'ADULT_18_24', 'ADULT_25_PLUS');
create type familiarity as enum ('BEGINNER', 'SOME_EXPERIENCE');
create type session_status as enum ('ACTIVE', 'PAUSED', 'FINISHED', 'ABANDONED');
create type lesson_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
create type txn_type as enum ('CREDIT', 'DEBIT');
create type xp_source as enum ('GAME', 'LESSON', 'QUIZ', 'DAILY', 'ACHIEVEMENT', 'ONBOARDING');
create type user_role as enum ('PLAYER', 'ADMIN');

-- ───────────────────────── Users ─────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text not null check (char_length(display_name) between 1 and 40),
  avatar_url     text,
  age_band       age_band not null default 'ADULT_18_24',
  parent_consent boolean not null default false,
  age_confirmed  boolean not null default false, -- false for OAuth signups until onboarding asks
  familiarity    familiarity not null default 'BEGINNER',
  onboarded_at   timestamptz,
  tutorial_done  boolean not null default false,
  role           user_role not null default 'PLAYER',
  created_at     timestamptz not null default now()
);

create table public.user_settings (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  sound_on       boolean not null default true,
  music_on       boolean not null default true,
  reduced_motion boolean not null default false,
  high_contrast  boolean not null default false,
  language       text not null default 'en' check (language in ('en', 'hi')),
  theme          text not null default 'system' check (theme in ('system', 'light', 'dark'))
);

create table public.player_progress (
  user_id          uuid primary key references public.profiles (id) on delete cascade,
  total_xp         int not null default 0,
  level            int not null default 1,
  current_streak   int not null default 0,
  longest_streak   int not null default 0,
  last_active_date date
);

create table public.xp_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  amount     int not null,
  source     xp_source not null,
  ref_id     text not null, -- sessionId / lessonSlug / date / achievement code / 'onboarding'
  created_at timestamptz not null default now()
);
create index xp_events_user_created on public.xp_events (user_id, created_at);
-- Each reward can be paid once: makes retries and concurrent requests idempotent.
create unique index xp_events_once on public.xp_events (user_id, source, ref_id);
create index xp_events_created on public.xp_events (created_at);

create table public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance bigint not null default 100000 -- ₹1,000 starter
);

create table public.wallet_txns (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.wallets (user_id) on delete cascade,
  amount     bigint not null,
  type       txn_type not null,
  reason     text not null,
  created_at timestamptz not null default now()
);
create index wallet_txns_user on public.wallet_txns (user_id, created_at);

-- ───────────────────────── Games ─────────────────────────
create table public.game_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  game_slug  text not null,
  status     session_status not null default 'ACTIVE',
  seed       int not null,
  state      jsonb not null,
  turn       int not null default 0,
  score      int not null default 0,
  version    int not null default 0, -- optimistic locking
  context    jsonb not null default '{}'::jsonb, -- e.g. { "daily": "2026-10-22" } or { "mission": true }
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at   timestamptz
);
create index game_sessions_user_status on public.game_sessions (user_id, status);

create table public.game_actions (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.game_sessions (id) on delete cascade,
  turn          int not null,
  type          text not null,
  payload       jsonb not null default '{}'::jsonb,
  result_events jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  unique (session_id, turn)
);

create table public.game_results (
  session_id   uuid primary key references public.game_sessions (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  game_slug    text not null,
  final_score  int not null,
  xp_earned    int not null,
  coins_earned bigint not null,
  learnings    text[] not null default '{}',
  stats        jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index game_results_slug_score on public.game_results (game_slug, final_score desc);
create index game_results_user on public.game_results (user_id, created_at);

-- ───────────────────────── Learning ─────────────────────────
create table public.lesson_progress (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  lesson_slug  text not null,
  status       lesson_status not null default 'NOT_STARTED',
  quiz_score   int,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);

create table public.assessments (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles (id) on delete cascade,
  type      text not null, -- ONBOARDING | MONTHLY | CATEGORY
  score     int not null,
  breakdown jsonb not null default '{}'::jsonb,
  taken_at  timestamptz not null default now()
);
create index assessments_user on public.assessments (user_id, taken_at);

-- ───────────────────────── Achievements ─────────────────────────
create table public.user_achievements (
  user_id          uuid not null references public.profiles (id) on delete cascade,
  achievement_code text not null,
  unlocked_at      timestamptz not null default now(),
  primary key (user_id, achievement_code)
);

-- ───────────────────────── Feedback ─────────────────────────
create table public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  email      text,
  message    text not null check (char_length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);

-- ───────────────────────── New-user bootstrap ─────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta    jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  band    text  := meta->>'age_band';
  consent boolean := lower(coalesce(meta->>'parent_consent', '')) in ('true', 't', '1', 'yes');
  valid   boolean := band in ('UNDER_13', 'TEEN_13_17', 'ADULT_18_24', 'ADULT_25_PLUS');
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── Leaderboards ─────────────────────────
create or replace function public.leaderboard_weekly_xp(max_rows int default 50)
returns table (user_id uuid, display_name text, avatar_url text, level int, score bigint, rank bigint)
language sql stable security definer set search_path = public
as $$
  select p.id, p.display_name, p.avatar_url, pp.level, sum(x.amount)::bigint as score,
         rank() over (order by sum(x.amount) desc) as rank
  from xp_events x
  join profiles p on p.id = x.user_id
  join player_progress pp on pp.user_id = p.id
  where x.created_at >= (date_trunc('week', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata')
  group by p.id, p.display_name, p.avatar_url, pp.level
  order by score desc
  limit max_rows;
$$;

create or replace function public.leaderboard_weekly_xp_rank(target uuid)
returns table (score bigint, rank bigint)
language sql stable security definer set search_path = public
as $$
  with totals as (
    select user_id, sum(amount)::bigint as score
    from xp_events where created_at >= (date_trunc('week', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata')
    group by user_id
  ), ranked as (
    select user_id, score, rank() over (order by score desc) as rank from totals
  )
  select score, rank from ranked where user_id = target;
$$;

create or replace function public.leaderboard_game(slug text, max_rows int default 50)
returns table (user_id uuid, display_name text, avatar_url text, level int, score bigint, rank bigint)
language sql stable security definer set search_path = public
as $$
  select p.id, p.display_name, p.avatar_url, pp.level, max(r.final_score)::bigint as score,
         rank() over (order by max(r.final_score) desc) as rank
  from game_results r
  join profiles p on p.id = r.user_id
  join player_progress pp on pp.user_id = p.id
  where r.game_slug = slug
  group by p.id, p.display_name, p.avatar_url, pp.level
  order by score desc
  limit max_rows;
$$;

create or replace function public.leaderboard_game_rank(slug text, target uuid)
returns table (score bigint, rank bigint)
language sql stable security definer set search_path = public
as $$
  with best as (
    select user_id, max(final_score)::bigint as score from game_results where game_slug = slug group by user_id
  ), ranked as (
    select user_id, score, rank() over (order by score desc) as rank from best
  )
  select score, rank from ranked where user_id = target;
$$;

-- Atomic wallet movement used by the server
create or replace function public.wallet_apply(target uuid, delta bigint, why text)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  new_balance bigint;
begin
  update wallets set balance = balance + delta where user_id = target returning balance into new_balance;
  if new_balance is null then raise exception 'wallet not found'; end if;
  if new_balance < 0 then raise exception 'insufficient balance'; end if;
  insert into wallet_txns (user_id, amount, type, reason)
  values (target, abs(delta), case when delta >= 0 then 'CREDIT'::txn_type else 'DEBIT'::txn_type end, why);
  return new_balance;
end;
$$;

-- Level curve: xpForLevel(L) = round(100 · L^1.5); must match lib/progress/level-curve.ts
create or replace function public.level_for(xp int)
returns int
language plpgsql immutable
as $$
declare
  lvl int := 1;
begin
  while round(100 * power(lvl + 1, 1.5)) <= xp loop
    lvl := lvl + 1;
  end loop;
  return lvl;
end;
$$;

-- Pays a batch of XP rewards atomically. Rewards already paid (same user/source/ref) are skipped.
-- awards = [{ "amount": 50, "source": "GAME", "ref_id": "<session id>" }, ...]
create or replace function public.award_xp(target uuid, awards jsonb)
returns table (total_xp int, level int, previous_level int, gained int)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  added int;
  prev  int;
begin
  with ins as (
    insert into xp_events (user_id, amount, source, ref_id)
    select target, (a->>'amount')::int, (a->>'source')::xp_source, a->>'ref_id'
    from jsonb_array_elements(awards) a
    where (a->>'amount')::int > 0
    on conflict (user_id, source, ref_id) do nothing
    returning amount
  )
  select coalesce(sum(amount), 0)::int into added from ins;

  select pp.level into prev from player_progress pp where pp.user_id = target for update;

  return query
  update player_progress pp
     set total_xp = pp.total_xp + added,
         level    = public.level_for(pp.total_xp + added)
   where pp.user_id = target
  returning pp.total_xp, pp.level, prev, added;
end;
$$;

-- Atomic daily streak bump (IST date passed in by the server).
create or replace function public.touch_streak(target uuid, today date)
returns int
language sql security definer set search_path = public
as $$
  update player_progress
     set current_streak = case
           when last_active_date = today then current_streak
           when last_active_date = today - 1 then current_streak + 1
           else 1 end,
         longest_streak = greatest(longest_streak, case
           when last_active_date = today then current_streak
           when last_active_date = today - 1 then current_streak + 1
           else 1 end),
         last_active_date = today
   where user_id = target
  returning current_streak;
$$;

-- ───────────────────────── Row level security ─────────────────────────
alter table public.profiles          enable row level security;
alter table public.user_settings     enable row level security;
alter table public.player_progress   enable row level security;
alter table public.xp_events         enable row level security;
alter table public.wallets           enable row level security;
alter table public.wallet_txns       enable row level security;
alter table public.game_sessions     enable row level security;
alter table public.game_actions      enable row level security;
alter table public.game_results      enable row level security;
alter table public.lesson_progress   enable row level security;
alter table public.assessments       enable row level security;
alter table public.user_achievements enable row level security;
alter table public.feedback          enable row level security;

-- Users read their own rows everywhere
create policy "own profile read"      on public.profiles          for select using (auth.uid() = id);
create policy "own settings read"     on public.user_settings     for select using (auth.uid() = user_id);
create policy "own progress read"     on public.player_progress   for select using (auth.uid() = user_id);
create policy "own xp read"           on public.xp_events         for select using (auth.uid() = user_id);
create policy "own wallet read"       on public.wallets           for select using (auth.uid() = user_id);
create policy "own txns read"         on public.wallet_txns       for select using (auth.uid() = user_id);
create policy "own sessions read"     on public.game_sessions     for select using (auth.uid() = user_id);
create policy "own actions read"      on public.game_actions      for select
  using (exists (select 1 from public.game_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "own results read"      on public.game_results      for select using (auth.uid() = user_id);
create policy "own lessons read"      on public.lesson_progress   for select using (auth.uid() = user_id);
create policy "own assessments read"  on public.assessments       for select using (auth.uid() = user_id);
create policy "own achievements read" on public.user_achievements for select using (auth.uid() = user_id);

-- Users may edit only cosmetic profile fields and settings; everything that affects score goes through the server
create policy "own settings update" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own profile update"  on public.profiles      for update using (auth.uid() = id) with check (auth.uid() = id);
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Anyone may leave feedback
create policy "anyone feedback insert" on public.feedback for insert with check (user_id is null or auth.uid() = user_id);

grant execute on function public.leaderboard_weekly_xp(int) to anon, authenticated;
grant execute on function public.leaderboard_game(text, int) to anon, authenticated;
revoke execute on function public.leaderboard_weekly_xp_rank(uuid) from anon, authenticated, public;
revoke execute on function public.leaderboard_game_rank(text, uuid) from anon, authenticated, public;
revoke execute on function public.wallet_apply(uuid, bigint, text) from anon, authenticated, public;
revoke execute on function public.award_xp(uuid, jsonb) from anon, authenticated, public;
revoke execute on function public.touch_streak(uuid, date) from anon, authenticated, public;

-- ───────────────────────── Storage: avatars ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "avatar upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar public read" on storage.objects for select using (bucket_id = 'avatars');
