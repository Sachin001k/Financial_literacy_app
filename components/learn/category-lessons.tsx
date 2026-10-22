'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, CircleDashed, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StaggerItem, StaggerList } from '@/components/motion/stagger';
import { useLessonStatus } from './use-lesson-progress';

export function CategoryLessons({ category, color, lessons }: { category: string; color: string; lessons: { slug: string; title: string; summary: string; readMinutes: number; xpReward: number }[] }) {
  const status = useLessonStatus();
  return (
    <StaggerList className="space-y-4">
      {lessons.map((l, i) => {
        const s = status.get(l.slug);
        return (
          <StaggerItem key={l.slug}>
            <Link href={`/learn/${category}/${l.slug}`} className="group flex items-center gap-4 rounded-3xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg">
              <motion.span whileHover={{ scale: 1.1 }} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white" style={{ background: color }}>
                {i + 1}
              </motion.span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{l.title}</h2>
                  {s?.status === 'COMPLETED' && <Badge tone="gain"><CheckCircle2 className="h-3 w-3" /> Done{s.quizScore !== null ? ` · ${s.quizScore}%` : ''}</Badge>}
                  {s?.status === 'IN_PROGRESS' && <Badge tone="coin"><CircleDashed className="h-3 w-3" /> In progress</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-muted">{l.summary}</p>
                <div className="mt-2 flex gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{l.readMinutes} min</span>
                  <span className="flex items-center gap-1 text-coin"><Zap className="h-3.5 w-3.5" />{l.xpReward} XP + quiz</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-brand" />
            </Link>
          </StaggerItem>
        );
      })}
    </StaggerList>
  );
}
