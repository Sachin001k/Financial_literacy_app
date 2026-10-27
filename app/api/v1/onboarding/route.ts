import { z } from 'zod';
import { ONBOARDING_MISSIONS } from '@/lib/content/games';
import { scoreAssessment } from '@/lib/server/assessment';
import { requireUser } from '@/lib/server/auth';
import { ApiError, handle, ok } from '@/lib/server/http';
import { ProgressService } from '@/lib/server/progress-service';
import { GameSessionService } from '@/lib/server/session-service';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const Body = z.object({
  familiarity: z.enum(['BEGINNER', 'SOME_EXPERIENCE']),
  tutorialDone: z.boolean(),
  assessmentAnswers: z.array(z.number().int()).optional(),
  startMission: z.boolean().default(true),
  ageBand: z.enum(['UNDER_13', 'TEEN_13_17', 'ADULT_18_24', 'ADULT_25_PLUS']).optional(),
  parentConsent: z.boolean().optional(),
});

/**
 * Saves the familiarity pick (and age for OAuth signups), records the baseline assessment once,
 * and creates the ₹1,000 first-mission session. Safe to call again: first-time rewards are not repeated.
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser(req);
  const body = Body.parse(await req.json());
  const db = getSupabaseAdmin();

  const { data: profile } = await db.from('profiles').select('onboarded_at, age_confirmed').eq('id', user.id).single();
  const update: Record<string, unknown> = { familiarity: body.familiarity, tutorial_done: body.tutorialDone };

  if (!profile?.age_confirmed) {
    if (!body.ageBand) throw new ApiError(400, 'AGE_REQUIRED', 'Please tell us your age group.');
    if (body.ageBand === 'UNDER_13') throw new ApiError(400, 'TOO_YOUNG', 'FinPlay is for ages 13 and up.');
    if (body.ageBand === 'TEEN_13_17' && !body.parentConsent) throw new ApiError(400, 'CONSENT_REQUIRED', 'A parent or guardian must agree first.');
    Object.assign(update, { age_band: body.ageBand, parent_consent: Boolean(body.parentConsent), age_confirmed: true });
  }

  // Score before claiming below, so a bad answer count can't mark the user onboarded without the baseline.
  const scored = body.assessmentAnswers?.length ? scoreAssessment(body.assessmentAnswers) : null;

  const { error } = await db.from('profiles').update(update).eq('id', user.id);
  if (error) throw new ApiError(500, 'SAVE_FAILED', error.message);

  // Claim "first onboarding" atomically so a double submit can't record the baseline twice.
  const { data: claimed } = await db
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('onboarded_at', null)
    .select('id');
  const firstTime = Boolean(claimed?.length);

  let assessment = null;
  if (firstTime && scored) {
    const { score, breakdown } = scored;
    const { data } = await db.from('assessments').insert({ user_id: user.id, type: 'ONBOARDING', score, breakdown }).select('*').single();
    assessment = data;
  }

  const progress = firstTime ? await new ProgressService(db).onOnboarded(user.id) : null;

  let mission = null;
  if (body.startMission) {
    const m = ONBOARDING_MISSIONS[body.familiarity];
    mission = await new GameSessionService(db).start(user.id, m.slug, { mission: true, config: m.config });
  }
  return ok({ assessment, progress, mission });
});
