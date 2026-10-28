-- Question bank: quiz questions live here instead of in code, so they can be edited from the dashboard,
-- drawn at random per player and level, and never repeated for a player until their pool runs out.
-- Run after 0003_fixes.sql. Then run 0005_seed_questions.sql to load the starter questions.

create type question_level as enum ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

create table public.questions (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,          -- stable key so the seed file can be re-run safely
  kind          text not null check (kind in ('CHALLENGE', 'SCAM')),
  level         question_level not null,
  topic         text not null,
  emoji         text not null default '💡',
  prompt        text not null,                 -- SCAM: the message body
  options       jsonb,                         -- CHALLENGE: ["option", ...]; null for templates
  correct_index int,                           -- CHALLENGE: index into options; null for templates
  explanation   text not null,
  template      text,                          -- number template key, see lib/game/question-templates.ts
  params        jsonb,                         -- template ranges, e.g. {"P": {"min": 5000, "max": 50000, "step": 1000}}
  is_scam       boolean,                       -- SCAM only
  meta          jsonb not null default '{}'::jsonb, -- SCAM: {"channel": "SMS", "sender": "...", "redFlags": [...]}
  active        boolean not null default true, -- switch off to retire a question without deleting its history
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint challenge_shape check (
    kind <> 'CHALLENGE'
    or (template is not null and params is not null)
    or (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 5
        and correct_index >= 0 and correct_index < jsonb_array_length(options))
  ),
  constraint scam_shape check (kind <> 'SCAM' or is_scam is not null)
);
create index questions_pick on public.questions (kind, level) where active;

-- Which player saw which question. Rows are written when a question is drawn (so abandoned games still
-- count as "seen") and marked right/wrong when the game is settled.
create table public.question_history (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  session_id  uuid,                            -- no FK: questions are drawn just before the session row exists
  correct     boolean,
  seen_at     timestamptz not null default now(),
  answered_at timestamptz
);
create index question_history_user_q on public.question_history (user_id, question_id);
create index question_history_user_session on public.question_history (user_id, session_id);

-- Current quiz level per player; null until first set (see quiz_level_for).
alter table public.player_progress
  add column quiz_level question_level,
  add column quiz_level_since timestamptz not null default now();

-- Only the server (service role) touches the bank: players must never be able to read the answers.
alter table public.questions        enable row level security;
alter table public.question_history enable row level security;
revoke all on public.questions, public.question_history from anon, authenticated;

-- Stored level, else a starting level from the onboarding assessment or familiarity pick.
create or replace function public.quiz_level_for(p_user uuid)
returns question_level
language sql stable
set search_path = public
as $$
  select coalesce(
    (select quiz_level from public.player_progress where user_id = p_user),
    (select case when a.score >= 70 then 'INTERMEDIATE'::question_level end
       from public.assessments a where a.user_id = p_user and a.type = 'ONBOARDING'
       order by a.taken_at desc limit 1),
    (select case when p.familiarity = 'SOME_EXPERIENCE' then 'INTERMEDIATE'::question_level else 'BEGINNER'::question_level end
       from public.profiles p where p.id = p_user),
    'BEGINNER'::question_level
  );
$$;

-- Picks p_count questions and logs them as seen.
--   Normal play: the player's level first, never-seen before seen, oldest-seen next, random within each.
--   p_seed set (daily challenge): every player gets the same questions, ordered by the seed, any level.
create or replace function public.draw_questions(
  p_user uuid,
  p_session uuid,
  p_kind text,
  p_count int,
  p_is_scam boolean default null,
  p_seed text default null
)
returns setof public.questions
language sql
set search_path = public
as $$
  with lvl as (
    select public.quiz_level_for(p_user) as level
  ),
  seen as (
    select question_id, max(seen_at) as last_seen
    from public.question_history
    where user_id = p_user and p_seed is null
    group by question_id
  ),
  picked as (
    select q.*
    from public.questions q
    cross join lvl
    left join seen s on s.question_id = q.id
    where q.active and q.kind = p_kind and (p_is_scam is null or q.is_scam = p_is_scam)
    order by
      case when p_seed is null then q.level <> lvl.level else false end,
      s.last_seen nulls first,
      md5(coalesce(p_seed, random()::text) || q.id::text)
    limit greatest(p_count, 0)
  ),
  logged as (
    insert into public.question_history (user_id, question_id, session_id)
    select p_user, id, p_session from picked
  )
  select * from picked;
$$;

-- Marks a finished game's answers, then moves the player's level:
-- 10+ answers at the current level since the last change, ≥ 80% right → up, ≤ 40% right → down.
create or replace function public.record_question_answers(p_user uuid, p_session uuid, p_answers jsonb)
returns question_level
language plpgsql
set search_path = public
as $$
declare
  cur question_level := public.quiz_level_for(p_user);
  since timestamptz;
  n int;
  acc numeric;
  nxt question_level;
begin
  update public.question_history h
     set correct = (a->>'correct')::boolean, answered_at = now()
    from jsonb_array_elements(p_answers) a
   where h.user_id = p_user
     and h.session_id = p_session
     and h.question_id = (a->>'id')::uuid
     and h.correct is null;

  select quiz_level_since into since from public.player_progress where user_id = p_user;

  select count(*), avg(case when correct then 1 else 0 end)
    into n, acc
    from (
      select h.correct
        from public.question_history h
        join public.questions q on q.id = h.question_id
       where h.user_id = p_user
         and h.correct is not null
         and q.level = cur
         and h.answered_at >= coalesce(since, '-infinity'::timestamptz)
       order by h.answered_at desc
       limit 20
    ) recent;

  nxt := cur;
  if n >= 10 and acc >= 0.8 and cur <> 'ADVANCED' then
    nxt := (case cur when 'BEGINNER' then 'INTERMEDIATE' else 'ADVANCED' end)::question_level;
  elsif n >= 10 and acc <= 0.4 and cur <> 'BEGINNER' then
    nxt := (case cur when 'ADVANCED' then 'INTERMEDIATE' else 'BEGINNER' end)::question_level;
  end if;

  update public.player_progress
     set quiz_level = nxt,
         quiz_level_since = case when nxt <> cur then now() else quiz_level_since end
   where user_id = p_user and (quiz_level is distinct from nxt);

  return nxt;
end;
$$;

revoke execute on function public.quiz_level_for(uuid) from anon, authenticated, public;
revoke execute on function public.draw_questions(uuid, uuid, text, int, boolean, text) from anon, authenticated, public;
revoke execute on function public.record_question_answers(uuid, uuid, jsonb) from anon, authenticated, public;
grant execute on function public.quiz_level_for(uuid) to service_role;
grant execute on function public.draw_questions(uuid, uuid, text, int, boolean, text) to service_role;
grant execute on function public.record_question_answers(uuid, uuid, jsonb) to service_role;
grant all on public.questions, public.question_history to service_role;
