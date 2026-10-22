import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ACHIEVEMENTS, type AchievementEvent } from '@/lib/content/achievements';
import { getGame } from '@/lib/content/games';
import { todayIST } from '@/lib/format';
import type { GameResult, ProgressUpdate, SessionContext } from '@/lib/game/types';
import { XP_REWARDS } from '@/lib/progress/level-curve';
import { getSupabaseAdmin } from '@/lib/supabase/server';

type XpSource = 'GAME' | 'LESSON' | 'QUIZ' | 'DAILY' | 'ACHIEVEMENT' | 'ONBOARDING';

interface Award {
  amount: number;
  source: XpSource;
  /** Idempotency key: each (user, source, refId) is paid at most once (unique index in SQL). */
  refId: string;
}

interface AwardResult {
  total_xp: number;
  level: number;
  previous_level: number;
  gained: number;
}

function yesterdayOf(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const finite = (n: number) => (Number.isFinite(n) ? n : 0);

export class ProgressService {
  constructor(private db: SupabaseClient = getSupabaseAdmin()) {}

  /**
   * game.finished handler: result row, XP, coins, daily bonus, streak, achievements.
   * Returns null when this session was already settled (the result row exists).
   * `completion` is the share of the game actually played; force-ended games are paid pro rata and get no daily bonus.
   */
  async onGameFinished(args: {
    userId: string;
    sessionId: string;
    gameSlug: string;
    result: GameResult;
    context: SessionContext;
    natural: boolean;
    completion: number;
  }): Promise<ProgressUpdate | null> {
    const { userId, sessionId, gameSlug, result, context, natural } = args;
    const game = getGame(gameSlug);
    const base = game?.xpReward ?? 50;
    const perf = Math.max(0, Math.min(1, finite(result.performance)));
    const completion = Math.max(0, Math.min(1, finite(args.completion)));
    const xp = Math.round(natural ? base * (0.3 + 0.7 * perf) : base * 0.7 * perf * completion);
    const coins = Math.round(base * 200 * perf * (natural ? 1 : completion)); // paise: up to ₹2 per XP point

    // The result row is the settlement lock: a second settle of the same session stops here.
    const { error: resultError } = await this.db.from('game_results').insert({
      session_id: sessionId,
      user_id: userId,
      game_slug: gameSlug,
      final_score: Math.round(finite(result.finalScore)),
      xp_earned: xp,
      coins_earned: coins,
      learnings: result.learnings,
      stats: { ...result.stats, goalReached: result.goalReached ? 1 : 0 },
    });
    if (resultError) {
      if (resultError.code === '23505') return null;
      throw new Error(`game_results insert failed: ${resultError.message}`);
    }

    if (coins > 0) {
      const { error } = await this.db.rpc('wallet_apply', { target: userId, delta: coins, why: `${game?.title ?? gameSlug} reward` });
      if (error) throw new Error(`wallet_apply failed: ${error.message}`);
    }

    const streak = await this.touchStreak(userId);
    const awards: Award[] = [{ amount: xp, source: 'GAME', refId: sessionId }];

    const today = todayIST();
    if (natural && context.daily && (context.daily === today || context.daily === yesterdayOf(today))) {
      const bonus = Math.min(XP_REWARDS.streakBonusCap, streak * XP_REWARDS.streakBonusPerDay);
      awards.push({ amount: XP_REWARDS.daily + bonus, source: 'DAILY', refId: context.daily });
    }

    const gamesFinished = await this.distinctGamesFinished(userId);
    const update = await this.applyAwards(
      userId,
      awards,
      [
        { kind: 'game.finished', gameSlug, score: result.finalScore, goalReached: result.goalReached, stats: result.stats },
        { kind: 'streak', days: streak },
      ],
      { gamesFinished, lessonsCompleted: 0 },
    );

    if (update.xpEarned !== xp) await this.db.from('game_results').update({ xp_earned: update.xpEarned }).eq('session_id', sessionId);
    return { ...update, coinsEarned: coins, streak };
  }

  /** Lesson + quiz XP; safe to call on every pass because each reward is keyed by the lesson slug. */
  async onLessonCompleted(userId: string, lessonSlug: string, quizScorePct: number, lessonXp: number) {
    const quizXp = Math.round(XP_REWARDS.quizMin + (XP_REWARDS.quizMax - XP_REWARDS.quizMin) * (quizScorePct / 100));
    const streak = await this.touchStreak(userId);
    const { count } = await this.db
      .from('lesson_progress')
      .select('lesson_slug', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'COMPLETED');
    const update = await this.applyAwards(
      userId,
      [
        { amount: lessonXp, source: 'LESSON', refId: lessonSlug },
        { amount: quizXp, source: 'QUIZ', refId: lessonSlug },
      ],
      [
        { kind: 'lesson.completed', lessonSlug, quizScore: quizScorePct },
        { kind: 'streak', days: streak },
      ],
      { gamesFinished: 0, lessonsCompleted: count ?? 0 },
    );
    return { ...update, streak };
  }

  async onOnboarded(userId: string) {
    return this.applyAwards(userId, [{ amount: XP_REWARDS.onboarding, source: 'ONBOARDING', refId: 'onboarding' }], [], { gamesFinished: 0, lessonsCompleted: 0 });
  }

  private async awardXp(userId: string, awards: Award[]): Promise<AwardResult> {
    const { data, error } = await this.db.rpc('award_xp', {
      target: userId,
      awards: awards.map((a) => ({ amount: Math.round(a.amount), source: a.source, ref_id: a.refId })),
    });
    if (error) throw new Error(`award_xp failed: ${error.message}`);
    const row = (data as AwardResult[] | null)?.[0];
    if (!row) throw new Error('award_xp returned no row');
    return row;
  }

  /** Pays XP atomically, then unlocks achievements (only rows actually inserted pay their XP). */
  private async applyAwards(
    userId: string,
    awards: Award[],
    events: AchievementEvent[],
    counters: { gamesFinished: number; lessonsCompleted: number },
  ): Promise<ProgressUpdate> {
    const first = await this.awardXp(userId, awards);

    const { data: owned } = await this.db.from('user_achievements').select('achievement_code').eq('user_id', userId);
    const have = new Set((owned ?? []).map((r) => r.achievement_code as string));
    const allEvents: AchievementEvent[] = [...events, { kind: 'level', level: first.level }];
    const candidates = ACHIEVEMENTS.filter((a) => !have.has(a.code) && allEvents.some((e) => a.rule(e, counters)));

    let unlocked: typeof candidates = [];
    let final = first;
    if (candidates.length) {
      const { data: inserted, error } = await this.db
        .from('user_achievements')
        .upsert(candidates.map((a) => ({ user_id: userId, achievement_code: a.code })), { onConflict: 'user_id,achievement_code', ignoreDuplicates: true })
        .select('achievement_code');
      if (error) throw new Error(`user_achievements insert failed: ${error.message}`);
      const fresh = new Set((inserted ?? []).map((r) => r.achievement_code as string));
      unlocked = candidates.filter((a) => fresh.has(a.code));
      if (unlocked.length) {
        const second = await this.awardXp(userId, unlocked.map((a) => ({ amount: a.xpReward, source: 'ACHIEVEMENT' as const, refId: a.code })));
        final = { ...second, previous_level: first.previous_level, gained: first.gained + second.gained };
      }
    }

    const { data: prog } = await this.db.from('player_progress').select('current_streak').eq('user_id', userId).single();
    return {
      xpEarned: final.gained,
      coinsEarned: 0,
      totalXp: final.total_xp,
      level: final.level,
      levelUp: final.level > final.previous_level,
      newAchievements: unlocked.map((a) => ({ code: a.code, title: a.title, icon: a.icon })),
      streak: prog?.current_streak ?? 0,
    };
  }

  async touchStreak(userId: string): Promise<number> {
    const { data, error } = await this.db.rpc('touch_streak', { target: userId, today: todayIST() });
    if (error) throw new Error(`touch_streak failed: ${error.message}`);
    return Number(data ?? 0);
  }

  private async distinctGamesFinished(userId: string): Promise<number> {
    const { data } = await this.db.from('game_results').select('game_slug').eq('user_id', userId);
    return new Set((data ?? []).map((r) => r.game_slug)).size;
  }
}
