import { dailyChallengeFor } from '@/lib/content/daily';
import { getRequestUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: Request) => {
  const daily = dailyChallengeFor();
  const user = await getRequestUser(req);
  let completed = false;
  if (user) {
    const { count } = await getSupabaseAdmin()
      .from('xp_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('source', 'DAILY')
      .eq('ref_id', daily.date);
    completed = Boolean(count);
  }
  const { config: _config, ...pub } = daily;
  return ok({ daily: { ...pub, completed } });
});
