import { CATEGORIES, lessonsIn } from '@/lib/content/lessons';
import { handle, ok } from '@/lib/server/http';

export const GET = handle(async () =>
  ok({
    categories: CATEGORIES.map((c) => ({
      ...c,
      lessonCount: lessonsIn(c.slug).length,
      lessons: lessonsIn(c.slug).map(({ slug, title, summary, readMinutes, xpReward }) => ({ slug, title, summary, readMinutes, xpReward })),
    })),
  }),
);
