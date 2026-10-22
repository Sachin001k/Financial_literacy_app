import { z } from 'zod';
import { ASSESSMENT_QUESTIONS } from '@/lib/content/lessons';
import { scoreAssessment } from '@/lib/server/assessment';
import { requireUser } from '@/lib/server/auth';
import { ApiError, handle, ok } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/** Questions without answers, for the knowledge check UI. */
export const GET = handle(async () =>
  ok({ questions: ASSESSMENT_QUESTIONS.map(({ prompt, options, topic }) => ({ prompt, options, topic })) }),
);

const Body = z.object({ type: z.enum(['ONBOARDING', 'MONTHLY', 'CATEGORY']).default('MONTHLY'), answers: z.array(z.number().int()) });

export const POST = handle(async (req: Request) => {
  const user = await requireUser(req);
  rateLimit(`assess:${user.id}`, 10);
  const body = Body.parse(await req.json());
  const { score, breakdown, review } = scoreAssessment(body.answers);
  const { data, error } = await getSupabaseAdmin()
    .from('assessments')
    .insert({ user_id: user.id, type: body.type, score, breakdown })
    .select('*')
    .single();
  if (error) throw new ApiError(500, 'SAVE_FAILED', error.message);
  return ok({ assessment: data, review });
});
