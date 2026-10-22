import { LearnHub } from '@/components/learn/learn-hub';
import { CATEGORIES, lessonsIn } from '@/lib/content/lessons';

export const metadata = { title: 'Learn', description: 'Bite-sized money lessons with quizzes and games to practise.' };

export default function LearnPage() {
  const categories = [...CATEGORIES]
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ ...c, lessons: lessonsIn(c.slug).map(({ slug, title, readMinutes }) => ({ slug, title, readMinutes })) }));
  return <LearnHub categories={categories} />;
}
