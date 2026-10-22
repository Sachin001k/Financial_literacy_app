import { z } from 'zod';
import { getRequestUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const Body = z.object({ email: z.string().email().optional().or(z.literal('')), message: z.string().trim().min(3).max(4000) });

export const POST = handle(async (req: Request) => {
  rateLimit(`feedback:${clientIp(req)}`, 5);
  const body = Body.parse(await req.json());
  const user = await getRequestUser(req);
  await getSupabaseAdmin().from('feedback').insert({ user_id: user?.id ?? null, email: body.email || user?.email || null, message: body.message });
  return ok({ ok: true });
});
