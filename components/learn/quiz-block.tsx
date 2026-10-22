'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, RotateCcw, Sparkles, Trophy, X } from 'lucide-react';
import { CountUp } from '@/components/motion/count-up';
import { burstConfetti } from '@/components/motion/confetti';
import { useAuth } from '@/components/providers/auth-provider';
import { useSound } from '@/components/providers/sound-provider';
import { toast } from '@/components/providers/toaster';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { api, queryKeys } from '@/lib/api';
import type { ProgressUpdate } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface QuizResult {
  score: number;
  passed: boolean;
  review: { correct: boolean; correctIndex: number; explanation: string }[];
  progress: ProgressUpdate | null;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** One question at a time; answers are graded on the server. */
export function QuizBlock({ slug, questions, color }: { slug: string; questions: { prompt: string; options: string[] }[]; color: string }) {
  const { refreshMe } = useAuth();
  const requireAuth = useRequireAuth();
  const { play } = useSound();
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const q = questions[index];
  const chosen = answers[index];
  const last = index === questions.length - 1;

  function choose(i: number) {
    play('click');
    setAnswers((a) => a.map((v, j) => (j === index ? i : v)));
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await api<QuizResult>(`/learn/lessons/${slug}/quiz`, { method: 'POST', json: { answers } });
      setResult(res);
      if (res.passed) {
        play(res.progress?.levelUp ? 'levelup' : 'success');
        burstConfetti(res.progress?.levelUp ? 'big' : 'small');
      } else play('fail');
      res.progress?.newAchievements.forEach((a) => toast.success(`Achievement unlocked: ${a.title}`, a.icon));
      await Promise.all([refreshMe(), qc.invalidateQueries({ queryKey: queryKeys.progress }), qc.invalidateQueries({ queryKey: queryKeys.home })]);
    } catch (e) {
      toast.error('Could not submit quiz', (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (!last) return setIndex((i) => i + 1);
    requireAuth(() => void submit(), undefined, 'Sign up to check your answers and earn XP.');
  }

  function retry() {
    setResult(null);
    setIndex(0);
    setAnswers(questions.map(() => null));
  }

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="quiz-title">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="quiz-title" className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-5 w-5" style={{ color }} /> Quick quiz
        </h2>
        {!result && <span className="text-sm text-muted">Question {index + 1} of {questions.length}</span>}
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key={index} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
            <Progress value={(index + (chosen !== null ? 1 : 0)) / questions.length} className="mb-6" label="Quiz progress" />
            <p className="mb-4 text-lg font-semibold">{q.prompt}</p>
            <div className="grid gap-3" role="radiogroup" aria-label={q.prompt}>
              {q.options.map((opt, i) => {
                const active = chosen === i;
                return (
                  <motion.button
                    key={i}
                    role="radio"
                    aria-checked={active}
                    onClick={() => choose(i)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    animate={active ? { scale: [1, 1.03, 1] } : {}}
                    className={cn('flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors', active ? 'border-brand bg-brand-soft' : 'border-border hover:border-brand/40')}
                  >
                    <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-bold', active ? 'bg-brand text-white' : 'bg-surface-2 text-muted')}>{LETTERS[i]}</span>
                    <span>{opt}</span>
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>Back</Button>
              <Button onClick={next} disabled={chosen === null} loading={submitting}>
                {last ? 'Check answers' : 'Next'} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ rotate: -30, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                className={cn('grid h-20 w-20 place-items-center rounded-full text-white shadow-xl', result.passed ? 'bg-gain' : 'bg-loss')}
              >
                {result.passed ? <Trophy className="h-10 w-10" /> : <RotateCcw className="h-10 w-10" />}
              </motion.div>
              <p className="mt-4 text-4xl font-extrabold"><CountUp value={result.score} format={(n) => `${Math.round(n)}%`} /></p>
              <p className="text-muted">{result.passed ? 'Lesson complete!' : 'Score 50% or more to complete the lesson.'}</p>
              {result.progress && result.progress.xpEarned > 0 && (
                <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="mt-3 rounded-full bg-coin/15 px-4 py-1.5 font-bold text-coin">
                  +<CountUp value={result.progress.xpEarned} /> XP
                </motion.p>
              )}
              {result.progress?.levelUp && (
                <motion.p initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 0.7 }} className="mt-3 rounded-2xl bg-gradient-to-r from-brand to-violet-500 px-5 py-2 font-bold text-white shadow-lg">
                  🎉 Level up! You’re now level {result.progress.level}
                </motion.p>
              )}
            </div>
            <ul className="mt-8 space-y-3">
              {questions.map((qq, i) => {
                const r = result.review[i];
                return (
                  <motion.li key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className={cn('rounded-2xl border p-4', r.correct ? 'border-gain/40 bg-gain/5' : 'border-loss/40 bg-loss/5')}>
                    <p className="flex items-start gap-2 font-semibold">
                      {r.correct ? <Check className="mt-0.5 h-5 w-5 shrink-0 text-gain" /> : <X className="mt-0.5 h-5 w-5 shrink-0 text-loss" />}
                      {qq.prompt}
                    </p>
                    {!r.correct && <p className="ml-7 mt-1 text-sm">Correct answer: <strong>{qq.options[r.correctIndex]}</strong></p>}
                    <p className="ml-7 mt-1 text-sm text-muted">{r.explanation}</p>
                  </motion.li>
                );
              })}
            </ul>
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={retry}><RotateCcw className="h-4 w-4" /> Try again</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
