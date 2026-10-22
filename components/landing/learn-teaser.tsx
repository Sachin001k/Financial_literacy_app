import Link from 'next/link';
import { ArrowRight, Clock, Zap } from 'lucide-react';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerItem, StaggerList } from '@/components/motion/stagger';
import { CATEGORIES, LESSONS } from '@/lib/content/lessons';

export function LearnTeaser() {
  const categories = [...CATEGORIES].sort((a, b) => a.order - b.order).slice(0, 5);
  const lessons = [...LESSONS].sort((a, b) => a.order - b.order).slice(0, 3);
  const colorOf = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.color ?? '#6366f1';

  return (
    <section className="container-page py-16" aria-labelledby="learn-title">
      <FadeIn className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Learning hub</p>
        <h2 id="learn-title" className="mt-1 text-3xl font-extrabold sm:text-4xl">Five-minute lessons, zero jargon</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">Every lesson has an example, a quick quiz, and a game to practise in.</p>
      </FadeIn>
      {categories.length > 0 && (
        <StaggerList className="mt-8 flex flex-wrap justify-center gap-3">
          {categories.map((c) => (
            <StaggerItem key={c.slug}>
              <Link
                href={`/learn/${c.slug}`}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: `${c.color}55` }}
              >
                <span aria-hidden>{c.icon}</span> {c.title}
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
      {lessons.length > 0 && (
        <StaggerList className="mt-10 grid gap-5 md:grid-cols-3">
          {lessons.map((l) => (
            <StaggerItem key={l.slug}>
              <Link href={`/learn/${l.category}/${l.slug}`} className="group block h-full rounded-3xl border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <span className="mb-4 block h-1.5 w-12 rounded-full transition-all duration-300 group-hover:w-24" style={{ background: colorOf(l.category) }} />
                <h3 className="text-lg font-bold">{l.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{l.summary}</p>
                <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{l.readMinutes} min</span>
                  <span className="flex items-center gap-1 text-coin"><Zap className="h-3.5 w-3.5" />{l.xpReward} XP</span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
      <div className="mt-8 text-center">
        <Link href="/learn" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
          Browse all lessons <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
