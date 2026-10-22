'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useProgress } from '@/components/learn/use-lesson-progress';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { getCategory } from '@/lib/content/lessons';
import { formatINR } from '@/lib/format';
import { useAssessments } from './use-assessments';

type Tab = 'games' | 'lessons' | 'assessments';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">{children}</p>;
}

export function HistoryTabs() {
  const [tab, setTab] = useState<Tab>('games');
  const { data: progress, isLoading } = useProgress();
  const { data: assess } = useAssessments();

  return (
    <div>
      <Tabs id="history" value={tab} onChange={setTab} tabs={[{ value: 'games', label: 'Games' }, { value: 'lessons', label: 'Lessons' }, { value: 'assessments', label: 'Assessments' }]} />
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4">
          {isLoading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14" />)}</div>
          ) : tab === 'games' ? (
            progress?.games.length ? (
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {progress.games.map((g) => (
                  <li key={g.session_id} className="flex items-center justify-between gap-3 p-4 text-sm">
                    <div>
                      <p className="font-semibold">{g.title}</p>
                      <p className="text-xs text-muted">{fmtDate(g.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Badge tone="brand">Score {g.final_score}</Badge>
                      <Badge tone="coin">+{g.xp_earned} XP</Badge>
                      {Number(g.coins_earned) > 0 && <Badge tone="gain">+{formatINR(Number(g.coins_earned))}</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No games finished yet. <Link href="/games" className="font-semibold text-brand">Play one now</Link>.</Empty>
            )
          ) : tab === 'lessons' ? (
            progress?.lessons.length ? (
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {progress.lessons.map((l) => (
                  <li key={l.lesson_slug}>
                    <Link href={l.category ? `/learn/${l.category}/${l.lesson_slug}` : '/learn'} className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-surface-2">
                      <div>
                        <p className="font-semibold">{l.title}</p>
                        <p className="text-xs text-muted">{l.category ? getCategory(l.category)?.title : ''}</p>
                      </div>
                      {l.status === 'COMPLETED' ? <Badge tone="gain">Done{l.quiz_score !== null ? ` · ${l.quiz_score}%` : ''}</Badge> : <Badge tone="coin">In progress</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No lessons yet. <Link href="/learn" className="font-semibold text-brand">Start learning</Link>.</Empty>
            )
          ) : assess?.assessments.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {[...assess.assessments].reverse().map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-semibold">{a.type === 'ONBOARDING' ? 'Starting check' : 'Knowledge check'}</p>
                    <p className="text-xs text-muted">{fmtDate(a.taken_at)}</p>
                  </div>
                  <Badge tone={a.score >= 70 ? 'gain' : a.score >= 40 ? 'coin' : 'loss'}>{a.score}%</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No assessments yet. Take a knowledge check above.</Empty>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
