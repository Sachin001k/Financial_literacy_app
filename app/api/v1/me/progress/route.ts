import { requireUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getGame } from '@/lib/content/games';
import { getLesson } from '@/lib/content/lessons';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: Request) => {
  const user = await requireUser(req);
  const db = getSupabaseAdmin();
  const [{ data: xp }, { data: games }, { data: lessons }] = await Promise.all([
    db.from('xp_events').select('amount, source, ref_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
    db.from('game_results').select('session_id, game_slug, final_score, xp_earned, coins_earned, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    db.from('lesson_progress').select('lesson_slug, status, quiz_score, completed_at').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ]);
  return ok({
    xpHistory: xp ?? [],
    games: (games ?? []).map((g) => ({ ...g, title: getGame(g.game_slug)?.title ?? g.game_slug })),
    lessons: (lessons ?? []).map((l) => ({ ...l, title: getLesson(l.lesson_slug)?.title ?? l.lesson_slug, category: getLesson(l.lesson_slug)?.category })),
  });
});
