import { z } from 'zod';
import { requireUser } from '@/lib/server/auth';
import { ApiError, handle, ok } from '@/lib/server/http';
import { getMeSummary } from '@/lib/server/me';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: Request) => {
  const user = await requireUser(req);
  return ok(await getMeSummary(user.id, user.email ?? null));
});

const Patch = z.object({ displayName: z.string().trim().min(2).max(40).optional(), avatarUrl: z
    .string()
    .url()
    .refine((u) => u.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/`), 'Avatar must be uploaded to FinPlay storage')
    .nullable()
    .optional() });

export const PATCH = handle(async (req: Request) => {
  const user = await requireUser(req);
  const body = Patch.parse(await req.json());
  const update: Record<string, unknown> = {};
  if (body.displayName !== undefined) update.display_name = body.displayName;
  if (body.avatarUrl !== undefined) update.avatar_url = body.avatarUrl;
  if (Object.keys(update).length) {
    const { error } = await getSupabaseAdmin().from('profiles').update(update).eq('id', user.id);
    if (error) throw new ApiError(500, 'SAVE_FAILED', error.message);
  }
  return ok(await getMeSummary(user.id, user.email ?? null));
});
