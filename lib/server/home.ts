import 'server-only';
import { ACHIEVEMENTS } from '@/lib/content/achievements';
import { dailyChallengeFor } from '@/lib/content/daily';
import { getGame } from '@/lib/content/games';
import { getLesson, LESSONS } from '@/lib/content/lessons';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getMeSummary } from './me';

/** Everything the home dashboard needs in one round trip. */
export async function homeFor(userId: string, email: string | null) {
  const db = getSupabaseAdmin();
  const daily = dailyChallengeFor();
  const [me, { data: session }, { data: lessons }, { data: achievements }, { count: dailyDone }] = await Promise.all([
    getMeSummary(userId, email),
    db.from('game_sessions').select('id, game_slug, turn, state, updated_at').eq('user_id', userId).in('status', ['ACTIVE', 'PAUSED']).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('lesson_progress').select('lesson_slug, status, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
    db.from('user_achievements').select('achievement_code, unlocked_at').eq('user_id', userId).order('unlocked_at', { ascending: false }).limit(3),
    db.from('xp_events').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('source', 'DAILY').eq('ref_id', daily.date),
  ]);

  const done = new Set((lessons ?? []).filter((l) => l.status === 'COMPLETED').map((l) => l.lesson_slug as string));
  const inProgress = (lessons ?? []).find((l) => l.status === 'IN_PROGRESS');
  const nextLesson =
    (inProgress && getLesson(inProgress.lesson_slug)) ||
    [...LESSONS].sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order).find((l) => !done.has(l.slug)) ||
    null;

  const game = session ? getGame(session.game_slug) : null;
  const totalTurns = Number((session?.state as { totalTurns?: number } | undefined)?.totalTurns ?? 0);

  return {
    me,
    continueGame: session && game
      ? { sessionId: session.id, slug: game.slug, title: game.title, cover: game.cover, progress: totalTurns ? Math.min(1, session.turn / totalTurns) : 0 }
      : null,
    continueLesson: nextLesson
      ? { slug: nextLesson.slug, category: nextLesson.category, title: nextLesson.title, summary: nextLesson.summary, readMinutes: nextLesson.readMinutes }
      : null,
    daily: { ...daily, completed: Boolean(dailyDone) },
    recentAchievements: (achievements ?? []).map((a) => {
      const def = ACHIEVEMENTS.find((d) => d.code === a.achievement_code);
      return { code: a.achievement_code, title: def?.title ?? a.achievement_code, icon: def?.icon ?? '🏅', unlockedAt: a.unlocked_at };
    }),
    lessonsCompleted: done.size,
  };
}
