# FinPlay

FinPlay teaches money and investing through short games. All money in it is virtual (₹). Anyone can browse the games and lessons; you need a free account to play and save progress.

The app follows the *FinPlay — Web App System Design (HLD + LLD)* doc, adapted to run on **Next.js 14 + Supabase**.

## Stack

| Layer | Choice |
| --- | --- |
| Web | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Animation | Framer Motion, GSAP ScrollTrigger, canvas-confetti |
| Charts | Recharts and custom SVG candlesticks |
| State | TanStack Query (server cache), Zustand (toasts) |
| Auth | Supabase Auth: email + password and Google OAuth |
| Database | Supabase Postgres with row-level security |
| API | REST route handlers under `/api/v1` (cookie auth for web, `Authorization: Bearer` for a future mobile app) |
| Tests | Vitest (game engines) |

### How this differs from the design doc

| Doc | Here | Why |
| --- | --- | --- |
| NestJS API | Next.js route handlers in `app/api/v1` | One deployable; the module boundaries stay the same (`lib/server/*`) |
| Prisma + Postgres | Supabase Postgres, schema in `supabase/migrations` | Supabase was chosen as the backend |
| JWT + refresh cookie, Passport | Supabase Auth sessions | Built in; also issues tokens for mobile through `/api/v1/auth/*` |
| Redis leaderboards | SQL functions `leaderboard_*` | Fast enough at v1 scale |
| BullMQ workers | `pg_cron` job `abandon_idle_sessions` | No extra infrastructure |
| Games, lessons and achievements as DB rows | TypeScript content files in `lib/content` | Edit content without a migration; rows reference them by slug |

The rules from the doc still hold. Game engines are pure and seeded. The client only renders outcomes. Score, XP, wallet and achievements are written only on the server using the service-role key. Money is stored in paise.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migrations.** In the Supabase SQL editor, run these files in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_jobs.sql`
   - `supabase/migrations/0003_fixes.sql`

   If you use the Supabase CLI instead, run `supabase db push`.
3. **Add your keys.** Copy `.env.example` to `.env.local` and fill in the values from *Project Settings → API*:
   ```bash
   cp .env.example .env.local
   ```
   | Variable | Where to find it |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (server only, never commit it) |
   | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, your domain in production |
   | `DAILY_SEED_SECRET` | Optional: any random string; keeps daily-challenge outcomes unguessable (defaults to the service-role key) |
4. **Configure auth** (Dashboard → Authentication):
   - *URL Configuration*: set Site URL to `NEXT_PUBLIC_SITE_URL` and add `http://localhost:3000/auth/callback` (and your production `/auth/callback`) to Redirect URLs.
   - *Providers → Google*: optional. Enable it and paste your Google OAuth client ID and secret.
   - *Providers → Email*: if "Confirm email" is on, new users must click the email link before they can play.
   - *Email Templates → Confirm signup*: so the link also works when opened on another device, change the link to
     `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/welcome`.
     With the default template, a link opened in a different browser still confirms the email, and the user is asked to log in.
5. **Optional:** enable the `pg_cron` extension, then re-run `0002_jobs.sql` to schedule the hourly cleanup of idle sessions.
6. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Game engine unit tests (seeded, deterministic) |

## Project layout

```
app/                      routes (landing, home, games, play, learn, welcome, profile, leaderboard, about, auth)
app/api/v1/               REST API (auth, me, onboarding, home, games, game-sessions, learn, assessments,
                          daily-challenge, leaderboards, market, feedback)
components/               ui primitives, motion primitives, layout, landing, games, play (+ renderers), learn, home, profile
lib/game/                 GameEngine interface, BaseGameEngine, SeededRandom, registry, engines/
lib/server/               GameSessionService, ProgressService, leaderboard, catalogue, auth helpers
lib/content/              games, lessons + quizzes, achievements, market assets, daily challenge
lib/supabase/             browser, server and middleware clients
supabase/migrations/      schema, RLS policies, leaderboard functions, jobs
tests/                    engine tests
```

## API

All routes live under `/api/v1`. Errors look like `{ "error": { "code": "TURN_MISMATCH", "message": "..." } }`.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | Public | Token auth for API clients (the web app uses Supabase directly) |
| `GET /me`, `PATCH /me`, `PATCH /me/settings` | User | Profile, progress, wallet, settings |
| `POST /onboarding` | User | Familiarity, tutorial, baseline assessment, first ₹1,000 mission |
| `GET /home` | User | Dashboard aggregate |
| `GET /games`, `GET /games/:slug` | Public | Catalogue with per-user locks and progress |
| `POST /games/:slug/sessions` | User | Start or resume a game (`{ daily?, fresh? }`) |
| `GET /game-sessions/:id` | Owner | Resume state |
| `POST /game-sessions/:id/actions` | Owner | `{ turn, type, payload }` → outcome (+ result when the game ends) |
| `POST /game-sessions/:id/finish`, `/abandon`, `/pause` | Owner | End early, quit, pause |
| `GET /learn/categories`, `GET /learn/lessons/:slug` | Public | Lessons (quiz answers are never sent to the client) |
| `POST /learn/lessons/:slug/quiz` | User | Grade answers, award XP |
| `GET /me/progress`, `GET /me/achievements`, `GET /me/assessments` | User | History |
| `GET /assessments`, `POST /assessments` | Mixed | Knowledge check questions / submit answers |
| `GET /daily-challenge` | Public | Today's challenge |
| `GET /leaderboards/:board` | Public | `weekly-xp` or a game slug; top 50 + your rank |
| `GET /market/assets`, `GET /market/assets/:symbol/bars` | User | Synthetic price data for stock games |
| `POST /feedback` | Public | About-page feedback form |

Rate limits: auth 10/min per IP; per user: game actions 60/min, game starts and finishes 20/min, quiz submits 20/min. They are kept in memory, so move them to a shared store (for example Upstash Redis) before running several instances.

## Adding a game

1. Write an engine in `lib/game/engines/<slug>.ts` that extends `BaseGameEngine`.
2. Register it in `lib/game/registry.ts`.
3. Add its catalogue entry to `lib/content/games.ts`.
4. Add a renderer in `components/play/renderers/` and register it in that folder's `index.ts`.

The API, HUD, progress and leaderboards need no changes.

## Open questions from the design doc

- Final product name and brand colours.
- Real NSE prices (needs a licensed data source) or the synthetic series used now.
- Minimum signup age and whether verified parental consent is needed. Right now under-13s are blocked and 13–17s tick a parental-consent box. Check this against India's DPDP Act 2023 with counsel.
- Languages beyond English. The settings already store `language`; Hindi content is not written yet.
