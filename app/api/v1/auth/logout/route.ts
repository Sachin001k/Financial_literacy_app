import { getSupabaseServer } from '@/lib/supabase/server';
import { handle, ok } from '@/lib/server/http';

export const POST = handle(async () => {
  await getSupabaseServer().auth.signOut();
  return ok({ ok: true });
});
