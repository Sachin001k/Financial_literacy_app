'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChallengeState } from '@/lib/game/engines/money-challenges';
import { cn } from '@/lib/utils';
import { shouldIgnoreGameKey } from '../keyboard';
import type { RendererProps } from './types';

type Card = NonNullable<ChallengeState['current']>;

/** Scenario cards that flip to show the answer and why. */
export function ChallengeDeck({ state, onAction, busy }: RendererProps<ChallengeState>) {
  const asked = useRef<{ card: Card; index: number } | null>(null);
  const [reveal, setReveal] = useState<{ card: Card; r: NonNullable<ChallengeState['lastReveal']> } | null>(null);

  useEffect(() => {
    const r = state.lastReveal;
    if (r && asked.current && state.index === asked.current.index + 1) {
      setReveal({ card: asked.current.card, r });
      asked.current = null;
    }
  }, [state.lastReveal, state.index]);

  const answer = (i: number) => {
    if (busy || !state.current || reveal) return;
    asked.current = { card: state.current, index: state.index };
    onAction('ANSWER', { choice: i });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreGameKey(e)) return;
      if (reveal && (e.key === 'Enter' || e.key === ' ')) {
        if (!state.current) return;
        e.preventDefault();
        setReveal(null);
        return;
      }
      const n = Number(e.key);
      if (!reveal && state.current && n >= 1 && n <= state.current.options.length) {
        e.preventDefault();
        answer(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const card = reveal?.card ?? state.current;
  if (!card) return null;
  const position = reveal ? state.index : state.index + 1;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-center gap-1.5" aria-hidden>
        {state.deck.map((_, i) => {
          const ans = state.answers[i];
          return <span key={i} className={cn('h-2 w-6 rounded-full transition-colors', ans ? (ans.correct ? 'bg-gain' : 'bg-loss') : i === state.index ? 'bg-brand' : 'bg-surface-2')} />;
        })}
      </div>
      <div style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${card.id}-${reveal ? 'back' : 'front'}`}
            initial={{ rotateY: reveal ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: reveal ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="rounded-3xl border border-border bg-surface p-6 shadow-xl sm:p-8"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{card.topic}</span>
              <span className="text-xs text-muted">Card {position} of {state.deck.length}</span>
            </div>
            <div className="mt-5 flex items-start gap-4">
              <span className="text-5xl" aria-hidden>{card.emoji}</span>
              <h2 className="text-xl font-bold leading-snug sm:text-2xl">{card.prompt}</h2>
            </div>

            <div className="mt-6 space-y-3">
              {card.options.map((o, i) => {
                const isCorrect = reveal && i === reveal.r.correctIndex;
                const isWrongPick = reveal && i === reveal.r.choice && !reveal.r.correct;
                return (
                  <motion.button
                    key={o}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: isWrongPick ? [0, -8, 8, -4, 0] : 0 }}
                    transition={{ delay: reveal ? 0 : 0.1 + i * 0.07 }}
                    whileHover={!reveal ? { x: 4 } : undefined}
                    disabled={busy || Boolean(reveal)}
                    onClick={() => answer(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left font-medium transition-colors',
                      !reveal && 'border-border hover:border-brand hover:bg-brand-soft/40',
                      isCorrect && 'border-gain bg-gain/10',
                      isWrongPick && 'border-loss bg-loss/10',
                      reveal && !isCorrect && !isWrongPick && 'border-border opacity-60',
                    )}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1">{o}</span>
                    {isCorrect && <CheckCircle2 className="h-5 w-5 text-gain" aria-label="Correct answer" />}
                    {isWrongPick && <XCircle className="h-5 w-5 text-loss" aria-label="Your answer" />}
                  </motion.button>
                );
              })}
            </div>

            {reveal && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
                <p className={cn('font-display text-lg font-bold', reveal.r.correct ? 'text-gain' : 'text-loss')}>{reveal.r.correct ? '✓ Correct!' : '✗ Not quite'}</p>
                <p className="mt-1 leading-relaxed text-muted">{reveal.r.explanation}</p>
                {state.current && (
                  <Button className="mt-5 w-full" size="lg" onClick={() => setReveal(null)}>
                    Next card <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {!reveal && <p className="mt-3 text-center text-xs text-muted">Tip: press 1–{card.options.length} to answer</p>}
    </div>
  );
}
