import { requireUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: Request) => {
  const user = await requireUser(req);
  const { data } = await getSupabaseAdmin().from('assessments').select('*').eq('user_id', user.id).order('taken_at', { ascending: true });
  return ok({ assessments: data ?? [] });
});
