import { getLesson } from '@/lib/content/lessons';
import { getRequestUser } from '@/lib/server/auth';
import { ApiError, handle, ok } from '@/lib/server/http';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Lesson + quiz without answers. Marks IN_PROGRESS for signed-in readers. */
export const GET = handle(async (req: Request, { params }: { params: { slug: string } }) => {
  const lesson = getLesson(params.slug);
  if (!lesson) throw new ApiError(404, 'LESSON_NOT_FOUND', 'Lesson not found.');
  const user = await getRequestUser(req);
  let progress = null;
  if (user) {
    const db = getSupabaseAdmin();
    const { data } = await db.from('lesson_progress').select('status, quiz_score').eq('user_id', user.id).eq('lesson_slug', lesson.slug).maybeSingle();
    progress = data;
    if (!data) await db.from('lesson_progress').insert({ user_id: user.id, lesson_slug: lesson.slug, status: 'IN_PROGRESS' });
  }
  const { questions, ...rest } = lesson;
  return ok({
    lesson: { ...rest, questions: questions.map(({ prompt, options }) => ({ prompt, options })) },
    progress,
  });
});
