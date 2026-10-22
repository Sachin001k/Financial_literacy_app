import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/env';
import { ApiError, handle, ok } from '@/lib/server/http';

const Body = z.object({ refreshToken: z.string().min(1) });

export const POST = handle(async (req: Request) => {
  const { refreshToken } = Body.parse(await req.json());
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error) throw new ApiError(401, 'INVALID_REFRESH', error.message);
  return ok({ session: data.session });
});
