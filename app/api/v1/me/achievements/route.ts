import { ACHIEVEMENTS } from '@/lib/content/achievements';
import { requireUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: Request) => {
  const user = await requireUser(req);
  const { data } = await getSupabaseAdmin().from('user_achievements').select('achievement_code, unlocked_at').eq('user_id', user.id);
  const unlocked = new Map((data ?? []).map((r) => [r.achievement_code as string, r.unlocked_at as string]));
  return ok({
    achievements: ACHIEVEMENTS.map(({ rule: _rule, ...a }) => ({ ...a, unlockedAt: unlocked.get(a.code) ?? null })),
  });
});
