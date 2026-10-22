import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { CategoryLessons } from '@/components/learn/category-lessons';
import { FadeIn } from '@/components/motion/fade-in';
import { CATEGORIES, getCategory, lessonsIn } from '@/lib/content/lessons';

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: { params: { category: string } }) {
  const c = getCategory(params.category);
  return { title: c ? c.title : 'Learn' };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = getCategory(params.category);
  if (!category) notFound();
  const lessons = lessonsIn(category.slug).map(({ slug, title, summary, readMinutes, xpReward }) => ({ slug, title, summary, readMinutes, xpReward }));
  return (
    <div className="container-page max-w-3xl py-10">
      <Link href="/learn" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ChevronLeft className="h-4 w-4" /> All categories
      </Link>
      <FadeIn className="mb-8 flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-2xl text-4xl" style={{ background: `${category.color}22` }}>{category.icon}</span>
        <div>
          <h1 className="text-3xl font-extrabold">{category.title}</h1>
          <p className="text-muted">{category.blurb}</p>
        </div>
      </FadeIn>
      <CategoryLessons category={category.slug} color={category.color} lessons={lessons} />
    </div>
  );
}
