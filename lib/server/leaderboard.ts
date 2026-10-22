import 'server-only';
import { getGame } from '@/lib/content/games';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ApiError } from './http';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  score: number;
  rank: number;
}

/** Board "weekly-xp" or a game slug (best score per player). */
export async function leaderboard(board: string, userId: string | null, limit = 50) {
  const db = getSupabaseAdmin();
  const isXp = board === 'weekly-xp';
  if (!isXp && !getGame(board)) throw new ApiError(404, 'BOARD_NOT_FOUND', 'Unknown leaderboard.');

  const { data, error } = isXp
    ? await db.rpc('leaderboard_weekly_xp', { max_rows: limit })
    : await db.rpc('leaderboard_game', { slug: board, max_rows: limit });
  if (error) throw new ApiError(500, 'LEADERBOARD_FAILED', error.message);

  const entries: LeaderboardEntry[] = (data ?? []).map((r: Record<string, unknown>) => ({
    userId: r.user_id as string,
    displayName: r.display_name as string,
    avatarUrl: (r.avatar_url as string) ?? null,
    level: Number(r.level),
    score: Number(r.score),
    rank: Number(r.rank),
  }));

  let me: { score: number; rank: number } | null = null;
  if (userId) {
    const { data: mine } = isXp
      ? await db.rpc('leaderboard_weekly_xp_rank', { target: userId })
      : await db.rpc('leaderboard_game_rank', { slug: board, target: userId });
    const row = (mine as { score: number; rank: number }[] | null)?.[0];
    if (row) me = { score: Number(row.score), rank: Number(row.rank) };
  }
  return { board, entries, me };
}
