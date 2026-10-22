'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerItem, StaggerList } from '@/components/motion/stagger';
import { TiltCard } from '@/components/motion/tilt-card';
import type { Category } from '@/lib/content/lesson-types';
import { ProgressRing } from './progress-ring';
import { useLessonStatus } from './use-lesson-progress';

export interface HubCategory extends Category {
  lessons: { slug: string; title: string; readMinutes: number }[];
}

export function LearnHub({ categories }: { categories: HubCategory[] }) {
  const { user } = useAuth();
  const status = useLessonStatus();
  const all = categories.flatMap((c) => c.lessons.map((l) => ({ ...l, category: c })));
  const inProgress = all.find((l) => status.get(l.slug)?.status === 'IN_PROGRESS');
  const next = inProgress ?? all.find((l) => status.get(l.slug)?.status !== 'COMPLETED');
  const completed = all.filter((l) => status.get(l.slug)?.status === 'COMPLETED').length;

  return (
    <div className="container-page py-10">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 sm:p-10">
        <motion.div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/20 blur-3xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div aria-hidden className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 9, repeat: Infinity }} />
        <FadeIn className="relative">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            <BookOpen className="h-3.5 w-3.5" /> Learning hub
          </p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Learn money in bite-sized lessons</h1>
          <p className="mt-2 max-w-xl text-muted">Each lesson is a 3–4 minute read with a real example, a quick quiz and a game to practise it.</p>
          {user && (
            <p className="mt-4 text-sm font-medium">
              <span className="text-gain">{completed}</span> of {all.length} lessons completed
            </p>
          )}
        </FadeIn>
        {user && next && (
          <FadeIn delay={0.15} className="relative mt-6">
            <Link href={`/learn/${next.category.slug}/${next.slug}`} className="group flex items-center gap-4 rounded-2xl border border-border bg-bg/60 p-4 transition hover:border-brand/50">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: `${next.category.color}22` }}>{next.category.icon}</span>
              <span className="flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{inProgress ? 'Continue learning' : 'Up next'}</span>
                <span className="block font-semibold">{next.title}</span>
              </span>
              <ArrowRight className="h-5 w-5 text-brand transition-transform group-hover:translate-x-1" />
            </Link>
          </FadeIn>
        )}
      </div>

      <StaggerList className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const done = c.lessons.filter((l) => status.get(l.slug)?.status === 'COMPLETED').length;
          return (
            <StaggerItem key={c.slug}>
              <TiltCard className="h-full rounded-3xl" glow={`${c.color}44`}>
                <Link href={`/learn/${c.slug}`} className="flex h-full flex-col rounded-3xl border border-border bg-surface p-6 transition-shadow hover:shadow-xl">
                  <div className="flex items-start justify-between">
                    <motion.span whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} className="grid h-14 w-14 place-items-center rounded-2xl text-3xl" style={{ background: `${c.color}22` }}>
                      {c.icon}
                    </motion.span>
                    {user && (
                      <div className="relative">
                        <ProgressRing value={c.lessons.length ? done / c.lessons.length : 0} color={c.color} />
                        <span className="absolute inset-0 grid place-items-center text-xs font-bold">{done}/{c.lessons.length}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="mt-4 text-xl font-bold">{c.title}</h2>
                  <p className="mt-1 text-sm text-muted">{c.blurb}</p>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {c.lessons.map((l) => (
                      <li key={l.slug} className="flex items-center gap-2 text-muted">
                        {status.get(l.slug)?.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4 text-gain" /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />}
                        {l.title}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold" style={{ color: c.color }}>
                    {c.lessons.length} lessons <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </TiltCard>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </div>
  );
}
