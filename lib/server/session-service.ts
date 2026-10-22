import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getGame, lockFor } from '@/lib/content/games';
import { dailyChallengeFor } from '@/lib/content/daily';
import { registry } from '@/lib/game/registry';
import { hashString } from '@/lib/game/seeded-random';
import type { Action, ActResponse, Familiarity, FinishedSummary, GameState, SessionContext, SessionDTO, SessionStatus } from '@/lib/game/types';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ApiError } from './http';
import { ProgressService } from './progress-service';

interface SessionRow {
  id: string;
  user_id: string;
  game_slug: string;
  status: SessionStatus;
  seed: number;
  state: GameState;
  turn: number;
  score: number;
  version: number;
  context: SessionContext;
}

export class GameSessionService {
  constructor(
    private db: SupabaseClient = getSupabaseAdmin(),
    private progress = new ProgressService(db),
  ) {}

  private engineFor(slug: string) {
    const engine = registry.get(slug);
    if (!engine) throw new ApiError(404, 'GAME_NOT_FOUND', `No game called ${slug}.`);
    return engine;
  }

  async start(
    userId: string,
    slug: string,
    opts: { daily?: boolean; mission?: boolean; config?: Record<string, unknown>; fresh?: boolean } = {},
  ): Promise<SessionDTO> {
    const game = getGame(slug);
    if (!game) throw new ApiError(404, 'GAME_NOT_FOUND', `No game called ${slug}.`);
    const engine = this.engineFor(slug);

    const { data: profile } = await this.db.from('profiles').select('familiarity').eq('id', userId).single();
    const familiarity = (profile?.familiarity ?? 'BEGINNER') as Familiarity;

    const context: SessionContext = {};
    let config: Record<string, unknown> = { ...game.config };
    let seed = Math.floor(Math.random() * 2 ** 31);

    if (opts.daily) {
      const daily = dailyChallengeFor();
      if (daily.gameSlug !== slug) throw new ApiError(400, 'NOT_TODAYS_CHALLENGE', 'That is not today’s challenge.');
      context.daily = daily.date;
      config = daily.config;
      // Same seed for every player today, but not derivable without the server secret.
      seed = hashString(`daily:${daily.date}:${process.env.DAILY_SEED_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`) & 0x7fffffff;
    } else if (opts.mission && opts.config) {
      context.mission = true;
      config = opts.config;
    } else {
      const [{ data: prog }, { data: lessons }] = await Promise.all([
        this.db.from('player_progress').select('level').eq('user_id', userId).single(),
        this.db.from('lesson_progress').select('lesson_slug').eq('user_id', userId).eq('status', 'COMPLETED'),
      ]);
      const lock = lockFor(game, prog?.level ?? 1, new Set((lessons ?? []).map((l) => l.lesson_slug as string)));
      if (lock) throw new ApiError(403, 'GAME_LOCKED', lock.reason);
    }

    // Resume an unfinished session of the same game and kind instead of starting over;
    // `fresh` abandons only that same-kind session (a daily or mission run of the same game is left alone).
    const { data: open } = await this.db
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('game_slug', slug)
      .in('status', ['ACTIVE', 'PAUSED'])
      .order('updated_at', { ascending: false })
      .limit(10);
    const sameKind = ((open as SessionRow[] | null) ?? []).filter(
      (s) => (s.context.daily ?? null) === (context.daily ?? null) && Boolean(s.context.mission) === Boolean(context.mission),
    );
    if (!opts.fresh && sameKind.length) return this.resume(sameKind[0].id, userId);
    if (opts.fresh && sameKind.length) {
      await this.db
        .from('game_sessions')
        .update({ status: 'ABANDONED', ended_at: new Date().toISOString() })
        .in('id', sameKind.map((s) => s.id))
        .in('status', ['ACTIVE', 'PAUSED']);
    }

    const state = engine.init(config, { id: userId, familiarity }, seed);
    const { data, error } = await this.db
      .from('game_sessions')
      .insert({ user_id: userId, game_slug: slug, seed, state, turn: state.turn, score: state.score, context })
      .select('*')
      .single();
    if (error || !data) throw new ApiError(500, 'SESSION_CREATE_FAILED', error?.message ?? 'Could not start game.');
    return this.toDTO(data as SessionRow);
  }

  private async load(sessionId: string, userId: string): Promise<SessionRow> {
    const { data } = await this.db.from('game_sessions').select('*').eq('id', sessionId).maybeSingle();
    if (!data) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Game session not found.');
    if (data.user_id !== userId) throw new ApiError(403, 'FORBIDDEN', 'This is not your game.');
    return data as SessionRow;
  }

  async resume(sessionId: string, userId: string): Promise<SessionDTO> {
    const row = await this.load(sessionId, userId);
    if (row.status === 'PAUSED') {
      await this.db.from('game_sessions').update({ status: 'ACTIVE', updated_at: new Date().toISOString() }).eq('id', row.id);
      row.status = 'ACTIVE';
    }
    return this.toDTO(row);
  }

  async act(sessionId: string, userId: string, input: { turn: number; type: string; payload?: Record<string, unknown> }): Promise<ActResponse> {
    const row = await this.load(sessionId, userId);
    if (row.status === 'FINISHED' || row.status === 'ABANDONED') throw new ApiError(409, 'SESSION_CLOSED', 'This game has ended.');
    if (input.turn !== row.turn) throw new ApiError(409, 'TURN_MISMATCH', 'This game moved on in another tab. Reload to continue.');

    const engine = this.engineFor(row.game_slug);
    const action: Action = { type: input.type, payload: input.payload ?? {} };
    const outcome = engine.applyAction(row.state, action);
    const now = new Date().toISOString();

    const { data: updated } = await this.db
      .from('game_sessions')
      .update({
        state: outcome.state,
        turn: outcome.state.turn,
        score: outcome.state.score,
        version: row.version + 1,
        status: outcome.state.finished ? 'FINISHED' : 'ACTIVE',
        updated_at: now,
        ended_at: outcome.state.finished ? now : null,
      })
      .eq('id', row.id)
      .eq('version', row.version)
      .select('id');
    if (!updated?.length) throw new ApiError(409, 'TURN_MISMATCH', 'This game moved on in another tab. Reload to continue.');

    const { error: logError } = await this.db.from('game_actions').insert({
      session_id: row.id,
      turn: row.turn,
      type: action.type,
      payload: action.payload,
      result_events: outcome.events,
    });
    if (logError) console.error('game_actions insert failed', logError.message);

    const response: ActResponse = {
      state: engine.publicState(outcome.state),
      events: outcome.events,
      availableActions: outcome.availableActions,
      turn: outcome.state.turn,
      status: outcome.state.finished ? 'FINISHED' : 'ACTIVE',
    };
    if (outcome.state.finished) response.result = await this.settle({ ...row, state: outcome.state }, true);
    return response;
  }

  /** Force end: score what has been played so far (paid pro rata, no daily bonus). */
  async finish(sessionId: string, userId: string): Promise<FinishedSummary> {
    const row = await this.load(sessionId, userId);
    if (row.status === 'FINISHED') {
      const existing = await this.resultFor(row.id);
      if (existing) return existing;
      // Finished but not yet settled: either a settle is in flight, or it failed part-way. Retry it;
      // the result row insert makes this safe to run twice.
      return this.settle(row, this.engineFor(row.game_slug).isFinished(row.state));
    }
    if (row.status === 'ABANDONED') throw new ApiError(409, 'SESSION_CLOSED', 'This game was abandoned.');
    if (row.turn === 0) {
      await this.db.from('game_sessions').update({ status: 'ABANDONED', ended_at: new Date().toISOString() }).eq('id', row.id).eq('version', row.version);
      throw new ApiError(400, 'NOTHING_PLAYED', 'Make at least one move before finishing.');
    }
    const state = { ...row.state, finished: true };
    const { data: updated } = await this.db
      .from('game_sessions')
      .update({ status: 'FINISHED', state, version: row.version + 1, ended_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('version', row.version)
      .in('status', ['ACTIVE', 'PAUSED'])
      .select('id');
    if (!updated?.length) throw new ApiError(409, 'TURN_MISMATCH', 'This game moved on in another tab.');
    return this.settle({ ...row, state }, false);
  }

  async abandon(sessionId: string, userId: string) {
    const row = await this.load(sessionId, userId);
    if (row.status === 'FINISHED' || row.status === 'ABANDONED') return { status: row.status };
    const { data } = await this.db
      .from('game_sessions')
      .update({ status: 'ABANDONED', version: row.version + 1, ended_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('version', row.version)
      .select('status');
    return { status: (data?.[0]?.status ?? 'ACTIVE') as SessionStatus };
  }

  async pause(sessionId: string, userId: string) {
    const row = await this.load(sessionId, userId);
    if (row.status !== 'ACTIVE') return { status: row.status };
    // Pausing doesn't bump the version (moves stay valid), but only applies if no move landed meanwhile.
    await this.db.from('game_sessions').update({ status: 'PAUSED', updated_at: new Date().toISOString() }).eq('id', row.id).eq('version', row.version).eq('status', 'ACTIVE');
    return { status: 'PAUSED' as const };
  }

  private async settle(row: SessionRow, natural: boolean): Promise<FinishedSummary> {
    const engine = this.engineFor(row.game_slug);
    const result = engine.computeResult(row.state);
    const totalTurns = Number((row.state as { totalTurns?: number }).totalTurns ?? 0);
    const progress = await this.progress.onGameFinished({
      userId: row.user_id,
      sessionId: row.id,
      gameSlug: row.game_slug,
      result,
      context: row.context ?? {},
      natural,
      completion: natural ? 1 : totalTurns > 0 ? row.state.turn / totalTurns : 0,
    });
    if (!progress) {
      // Already settled by a concurrent request: return what was recorded.
      const existing = await this.resultFor(row.id);
      if (existing) return existing;
      throw new ApiError(409, 'SETTLING', 'Your results are being tallied. Try again in a moment.');
    }
    return { finalScore: result.finalScore, learnings: result.learnings, stats: result.stats, goalReached: result.goalReached, progress };
  }

  private async resultFor(sessionId: string): Promise<FinishedSummary | null> {
    const { data } = await this.db.from('game_results').select('*').eq('session_id', sessionId).maybeSingle();
    if (!data) return null;
    const { data: prog } = await this.db.from('player_progress').select('total_xp, level, current_streak').eq('user_id', data.user_id).single();
    return {
      finalScore: data.final_score,
      learnings: data.learnings,
      stats: data.stats,
      goalReached: Boolean((data.stats as Record<string, unknown>)?.goalReached),
      progress: {
        xpEarned: data.xp_earned,
        coinsEarned: Number(data.coins_earned),
        totalXp: prog?.total_xp ?? 0,
        level: prog?.level ?? 1,
        levelUp: false,
        newAchievements: [],
        streak: prog?.current_streak ?? 0,
      },
    };
  }

  private async toDTO(row: SessionRow): Promise<SessionDTO> {
    const engine = this.engineFor(row.game_slug);
    const finished = row.status === 'FINISHED';
    return {
      sessionId: row.id,
      gameSlug: row.game_slug,
      status: row.status,
      turn: row.turn,
      state: engine.publicState(row.state),
      availableActions: finished || row.status === 'ABANDONED' ? [] : engine.getAvailableActions(row.state),
      context: row.context ?? {},
      result: finished ? await this.resultFor(row.id) : null,
    };
  }
}
