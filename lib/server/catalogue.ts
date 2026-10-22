import 'server-only';
import { GAMES, GAME_SECTIONS, gamesInSection, lockFor, type GameDef, type LockInfo } from '@/lib/content/games';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export interface GameCardData extends Omit<GameDef, 'config'> {
  locked?: LockInfo;
  progress?: number;
  activeSessionId?: string;
  bestScore?: number;
}

/** Catalogue with per-user lock state, unfinished-session progress and best scores. */
export async function catalogueFor(userId: string | null) {
  let level: number | null = null;
  let completed = new Set<string>();
  const active = new Map<string, { id: string; turn: number; state: Record<string, unknown> }>();
  const best = new Map<string, number>();

  if (userId) {
    const db = getSupabaseAdmin();
    const [{ data: prog }, { data: lessons }, { data: sessions }, { data: results }] = await Promise.all([
      db.from('player_progress').select('level').eq('user_id', userId).single(),
      db.from('lesson_progress').select('lesson_slug').eq('user_id', userId).eq('status', 'COMPLETED'),
      db.from('game_sessions').select('id, game_slug, turn, state, context').eq('user_id', userId).in('status', ['ACTIVE', 'PAUSED']).order('updated_at', { ascending: false }),
      db.from('game_results').select('game_slug, final_score').eq('user_id', userId),
    ]);
    level = prog?.level ?? 1;
    completed = new Set((lessons ?? []).map((l) => l.lesson_slug as string));
    for (const s of sessions ?? []) {
      const ctx = (s.context ?? {}) as { daily?: string; mission?: boolean };
      if (!ctx.daily && !ctx.mission && !active.has(s.game_slug)) active.set(s.game_slug, { id: s.id, turn: s.turn, state: s.state });
    }
    for (const r of results ?? []) best.set(r.game_slug, Math.max(best.get(r.game_slug) ?? 0, r.final_score));
  }

  const card = (g: GameDef): GameCardData => {
    const { config: _config, ...rest } = g;
    const a = active.get(g.slug);
    const total = Number((a?.state as { totalTurns?: number } | undefined)?.totalTurns ?? 0);
    return {
      ...rest,
      locked: lockFor(g, level, completed),
      activeSessionId: a?.id,
      progress: a && total ? Math.min(1, a.turn / total) : undefined,
      bestScore: best.get(g.slug),
    };
  };

  return {
    games: GAMES.map(card),
    sections: GAME_SECTIONS.map((s) => ({ ...s, games: gamesInSection(s.key).map(card) })),
  };
}
