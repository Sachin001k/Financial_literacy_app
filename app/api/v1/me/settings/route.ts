import { z } from 'zod';
import { requireUser } from '@/lib/server/auth';
import { ApiError, handle, ok } from '@/lib/server/http';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const Patch = z.object({
  soundOn: z.boolean().optional(),
  musicOn: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  language: z.enum(['en', 'hi']).optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
});

const COLUMNS: Record<string, string> = {
  soundOn: 'sound_on',
  musicOn: 'music_on',
  reducedMotion: 'reduced_motion',
  highContrast: 'high_contrast',
  language: 'language',
  theme: 'theme',
};

export const PATCH = handle(async (req: Request) => {
  const user = await requireUser(req);
  const body = Patch.parse(await req.json());
  const update = Object.fromEntries(Object.entries(body).map(([k, v]) => [COLUMNS[k], v]));
  const { data, error } = await getSupabaseAdmin().from('user_settings').update(update).eq('user_id', user.id).select('*').single();
  if (error) throw new ApiError(500, 'SAVE_FAILED', error.message);
  return ok({ settings: data });
});
