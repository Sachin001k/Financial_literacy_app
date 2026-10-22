import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/env';
import { ApiError, handle, ok } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/rate-limit';

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export const POST = handle(async (req: Request) => {
  rateLimit(`auth:${clientIp(req)}`, 10);
  const body = Body.parse(await req.json());
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword(body);
  if (error) throw new ApiError(401, 'INVALID_CREDENTIALS', error.message);
  return ok({ session: data.session });
});
