import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, Lightbulb, Zap } from 'lucide-react';
import { LessonContent } from '@/components/learn/lesson-content';
import { LessonTracker } from '@/components/learn/lesson-tracker';
import { PractiseInGameCTA } from '@/components/learn/practise-cta';
import { QuizBlock } from '@/components/learn/quiz-block';
import { ReadingProgress } from '@/components/learn/reading-progress';
import { FadeIn } from '@/components/motion/fade-in';
import { getGame } from '@/lib/content/games';
import { getCategory, getLesson, LESSONS, lessonsIn } from '@/lib/content/lessons';

export function generateStaticParams() {
  return LESSONS.map((l) => ({ category: l.category, lesson: l.slug }));
}

export function generateMetadata({ params }: { params: { lesson: string } }) {
  const l = getLesson(params.lesson);
  return { title: l?.title ?? 'Lesson', description: l?.summary };
}

export default function LessonPage({ params }: { params: { category: string; lesson: string } }) {
  const lesson = getLesson(params.lesson);
  const category = getCategory(params.category);
  if (!lesson || !category || lesson.category !== category.slug) notFound();

  const siblings = lessonsIn(category.slug);
  const pos = siblings.findIndex((l) => l.slug === lesson.slug);
  const prev = siblings[pos - 1];
  const next = siblings[pos + 1];
  const game = lesson.practiseGameSlug ? getGame(lesson.practiseGameSlug) : undefined;
  // Only prompts and options reach the client; grading happens on the server.
  const questions = lesson.questions.map(({ prompt, options }) => ({ prompt, options }));

  return (
    <article className="container-page max-w-3xl py-10">
      <ReadingProgress color={category.color} />
      <LessonTracker slug={lesson.slug} />
      <Link href={`/learn/${category.slug}`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ChevronLeft className="h-4 w-4" /> {category.icon} {category.title}
      </Link>

      <FadeIn>
        <p className="text-sm font-semibold" style={{ color: category.color }}>Lesson {pos + 1} of {siblings.length}</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{lesson.title}</h1>
        <p className="mt-2 text-lg text-muted">{lesson.summary}</p>
        <div className="mt-4 flex gap-4 text-sm text-muted">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{lesson.readMinutes} min read</span>
          <span className="flex items-center gap-1 text-coin"><Zap className="h-4 w-4" />{lesson.xpReward} XP + quiz bonus</span>
        </div>
      </FadeIn>

      <FadeIn delay={0.1} className="mt-8">
        <LessonContent body={lesson.body} />
      </FadeIn>

      <FadeIn className="my-10">
        <aside className="relative overflow-hidden rounded-3xl border p-6" style={{ borderColor: `${category.color}55`, background: `${category.color}12` }}>
          <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: category.color }}>
            <Lightbulb className="h-4 w-4" /> Example: {lesson.example.title}
          </p>
          <p className="leading-7">{lesson.example.body}</p>
        </aside>
      </FadeIn>

      <FadeIn>
        <QuizBlock slug={lesson.slug} questions={questions} color={category.color} />
      </FadeIn>

      {game && (
        <FadeIn className="mt-10">
          <PractiseInGameCTA slug={game.slug} title={game.title} tagline={game.tagline} cover={game.cover} />
        </FadeIn>
      )}

      <nav className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Lesson navigation">
        {prev ? (
          <Link href={`/learn/${category.slug}/${prev.slug}`} className="group rounded-2xl border border-border bg-surface p-4 transition hover:border-brand/40">
            <span className="flex items-center gap-1 text-xs text-muted"><ChevronLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" /> Previous</span>
            <span className="font-semibold">{prev.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/learn/${category.slug}/${next.slug}`} className="group rounded-2xl border border-border bg-surface p-4 text-right transition hover:border-brand/40">
            <span className="flex items-center justify-end gap-1 text-xs text-muted">Next <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            <span className="font-semibold">{next.title}</span>
          </Link>
        ) : (
          <Link href="/learn" className="group rounded-2xl border border-border bg-surface p-4 text-right transition hover:border-brand/40">
            <span className="flex items-center justify-end gap-1 text-xs text-muted">Category done <ChevronRight className="h-3.5 w-3.5" /></span>
            <span className="font-semibold">Back to all categories</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
