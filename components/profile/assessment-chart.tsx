'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ClipboardCheck } from 'lucide-react';
import { burstConfetti } from '@/components/motion/confetti';
import { toast } from '@/components/providers/toaster';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api, queryKeys } from '@/lib/api';
import { CATEGORIES } from '@/lib/content/lessons';
import { cn } from '@/lib/utils';
import { useAssessments } from './use-assessments';

const tooltipStyle = { background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 12, color: 'rgb(var(--fg))' };

function KnowledgeCheck({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['assessment-questions'], queryFn: () => api<{ questions: { prompt: string; options: string[] }[] }>('/assessments'), staleTime: Infinity });
  const questions = data?.questions ?? [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  async function answer(choice: number) {
    const next = [...answers.slice(0, index), choice];
    setAnswers(next);
    if (index < questions.length - 1) return setIndex(index + 1);
    setBusy(true);
    try {
      const res = await api<{ assessment: { score: number } }>('/assessments', { method: 'POST', json: { type: 'MONTHLY', answers: next } });
      toast.success(`You scored ${res.assessment.score}%`, 'Saved to your progress.');
      if (res.assessment.score >= 70) burstConfetti();
      await qc.invalidateQueries({ queryKey: queryKeys.assessments });
      onDone();
    } catch (e) {
      toast.error('Could not save', (e as Error).message);
      setBusy(false);
    }
  }

  if (!questions.length) return <div className="skeleton h-48" />;
  const q = questions[index];
  return (
    <div>
      <Progress value={index / questions.length} className="mb-4" label="Knowledge check progress" />
      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <p className="mb-3 font-semibold">{index + 1}/{questions.length}. {q.prompt}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, i) => (
              <button key={i} disabled={busy} onClick={() => answer(i)} className="rounded-2xl border-2 border-border p-3 text-left text-sm transition hover:border-brand hover:bg-brand-soft disabled:opacity-60">
                {o}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <Button variant="ghost" size="sm" className="mt-3" onClick={onDone}>Cancel</Button>
    </div>
  );
}

export function AssessmentChart() {
  const { data, isLoading } = useAssessments();
  const [taking, setTaking] = useState(false);
  const rows = data?.assessments ?? [];
  const line = rows.map((a) => ({ date: new Date(a.taken_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), score: a.score }));
  const latest = rows[rows.length - 1];
  const bars = latest ? CATEGORIES.map((c) => ({ name: c.title.split(' ')[0], score: latest.breakdown[c.slug] ?? 0, color: c.color })) : [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{rows.length ? `Latest score ${latest.score}% · ${rows.length} check${rows.length > 1 ? 's' : ''} taken` : 'Track how your money knowledge grows over time.'}</p>
        {!taking && <Button size="sm" variant="outline" onClick={() => setTaking(true)}><ClipboardCheck className="h-4 w-4" /> Take knowledge check</Button>}
      </div>
      {taking ? (
        <KnowledgeCheck onDone={() => setTaking(false)} />
      ) : isLoading ? (
        <div className="skeleton h-56" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">No results yet. Take a 10-question check to see your strengths.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-56" aria-label="Assessment scores over time">
            <ResponsiveContainer>
              <LineChart data={line} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis dataKey="date" stroke="rgb(var(--muted))" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="rgb(var(--muted))" fontSize={12} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Score']} />
                <Line type="monotone" dataKey="score" stroke="rgb(var(--brand))" strokeWidth={3} dot={{ r: 5, fill: 'rgb(var(--brand))' }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3" aria-label="Latest score by topic">
            {bars.map((b, i) => (
              <div key={b.name}>
                <div className="mb-1 flex justify-between text-sm"><span>{b.name}</span><span className={cn('font-semibold', b.score >= 50 ? 'text-gain' : 'text-loss')}>{b.score}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                  <motion.div className="h-full rounded-full" style={{ background: b.color }} initial={{ width: 0 }} whileInView={{ width: `${b.score}%` }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 60 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
