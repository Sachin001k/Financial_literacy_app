import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/env';
import { ApiError, handle, ok } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/rate-limit';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(2).max(40),
  ageBand: z.enum(['UNDER_13', 'TEEN_13_17', 'ADULT_18_24', 'ADULT_25_PLUS']),
  parentConsent: z.boolean().optional(),
});

/** Token-returning signup for API clients (mobile). The web app signs up with supabase-js directly. */
export const POST = handle(async (req: Request) => {
  rateLimit(`auth:${clientIp(req)}`, 10);
  const body = Body.parse(await req.json());
  if (body.ageBand === 'UNDER_13') throw new ApiError(400, 'TOO_YOUNG', 'FinPlay is for ages 13 and up.');
  if (body.ageBand === 'TEEN_13_17' && !body.parentConsent) throw new ApiError(400, 'CONSENT_REQUIRED', 'A parent or guardian must agree first.');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/welcome`,
      data: { display_name: body.displayName, age_band: body.ageBand, parent_consent: Boolean(body.parentConsent) },
    },
  });
  if (error) throw new ApiError(400, 'SIGNUP_FAILED', error.message);
  return ok({ user: data.user ? { id: data.user.id, email: data.user.email } : null, session: data.session, needsEmailConfirmation: !data.session });
});
