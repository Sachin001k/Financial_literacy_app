import { z } from 'zod';
import { getLesson } from '@/lib/content/lessons';
import { requireUser } from '@/lib/server/auth';
import { ApiError, handle, ok } from '@/lib/server/http';
import { ProgressService } from '@/lib/server/progress-service';
import { rateLimit } from '@/lib/server/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const Body = z.object({ answers: z.array(z.number().int()) });
const PASS = 50;

/** Answers → score and XP (each lesson's XP is paid once). Correct answers are revealed only after a pass. */
export const POST = handle(async (req: Request, { params }: { params: { slug: string } }) => {
  const user = await requireUser(req);
  rateLimit(`quiz:${user.id}`, 20);
  const lesson = getLesson(params.slug);
  if (!lesson) throw new ApiError(404, 'LESSON_NOT_FOUND', 'Lesson not found.');
  const { answers } = Body.parse(await req.json());
  if (answers.length !== lesson.questions.length) throw new ApiError(400, 'ANSWER_COUNT', `Expected ${lesson.questions.length} answers.`);

  const marks = lesson.questions.map((q, i) => answers[i] === q.correctIndex);
  const score = Math.round((marks.filter(Boolean).length / lesson.questions.length) * 100);
  const passed = score >= PASS;
  const review = lesson.questions.map((q, i) =>
    passed ? { correct: marks[i], correctIndex: q.correctIndex, explanation: q.explanation } : { correct: marks[i] },
  );

  const db = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: existing } = await db.from('lesson_progress').select('status, quiz_score').eq('user_id', user.id).eq('lesson_slug', lesson.slug).maybeSingle();
  const completed = passed || existing?.status === 'COMPLETED';
  const { error } = await db.from('lesson_progress').upsert({
    user_id: user.id,
    lesson_slug: lesson.slug,
    status: completed ? 'COMPLETED' : 'IN_PROGRESS',
    quiz_score: Math.max(score, existing?.quiz_score ?? 0),
    completed_at: completed ? (existing?.status === 'COMPLETED' ? undefined : now) : null,
    updated_at: now,
  });
  if (error) throw new ApiError(500, 'SAVE_FAILED', error.message);

  // XP rows are keyed by lesson slug, so a repeat pass or a double submit pays nothing extra.
  const progress = passed ? await new ProgressService(db).onLessonCompleted(user.id, lesson.slug, score, lesson.xpReward) : null;
  return ok({ score, passed, review, progress, practiseGameSlug: lesson.practiseGameSlug ?? null });
});
