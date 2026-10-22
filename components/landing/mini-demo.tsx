'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Play, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { useSound } from '@/components/providers/sound-provider';
import { Button } from '@/components/ui/button';
import { useStartGame } from '@/hooks/use-start-game';
import { randomBars, type Bar } from '@/lib/content/market';
import { SeededRandom } from '@/lib/game/seeded-random';
import { cn } from '@/lib/utils';
import { CandleChart } from './candle-chart';

const DURATION = 30;
const VISIBLE = 24;
const REVEAL = 4;

type Phase = 'idle' | 'playing' | 'revealing' | 'over';

function makeRound(rng: SeededRandom): Bar[] {
  const drift = rng.normal(0, 0.006);
  return randomBars(rng, VISIBLE + REVEAL, 10000 + rng.int(0, 40000), 0.022, drift);
}

/** A 30-second, no-login taste of Bull or Bear. Runs fully in the browser. */
export function MiniDemo() {
  const { play } = useSound();
  const { playGame } = useStartGame();
  const rngRef = useRef(new SeededRandom(Date.now() % 100000));
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [bars, setBars] = useState<Bar[]>(() => makeRound(new SeededRandom(11)));
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [calls, setCalls] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [last, setLast] = useState<null | { right: boolean; call: 'BULL' | 'BEAR' }>(null);

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'revealing') return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 0.1)), 100);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (timeLeft <= 0 && (phase === 'playing' || phase === 'revealing')) {
      setPhase('over');
      play('levelup');
    }
  }, [timeLeft, phase, play]);

  useEffect(() => () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
  }, []);

  const start = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = null;
    rngRef.current = new SeededRandom(Date.now() % 1_000_000);
    setBars(makeRound(rngRef.current));
    setTimeLeft(DURATION);
    setScore(0);
    setStreak(0);
    setCalls(0);
    setCorrect(0);
    setLast(null);
    setPhase('playing');
    play('click');
  };

  const call = useCallback(
    (c: 'BULL' | 'BEAR') => {
      if (phase !== 'playing') return;
      const before = bars[VISIBLE - 1].close;
      const after = bars[bars.length - 1].close;
      const right = (after >= before) === (c === 'BULL');
      setLast({ right, call: c });
      setCalls((n) => n + 1);
      if (right) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setCorrect((n) => n + 1);
        setScore((s) => s + 10 * Math.min(5, nextStreak));
        play('success');
      } else {
        setStreak(0);
        play('fail');
      }
      setPhase('revealing');
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => {
        revealTimer.current = null;
        setBars(makeRound(rngRef.current));
        setLast(null);
        setPhase((p) => (p === 'revealing' ? 'playing' : p));
      }, 1400);
    },
    [phase, bars, streak, play],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key === 'ArrowUp') call('BULL');
      if (e.key === 'ArrowDown') call('BEAR');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, call]);

  const shown = phase === 'revealing' || phase === 'over' ? bars : bars.slice(0, VISIBLE);

  return (
    <section className="container-page py-16" aria-labelledby="demo-title">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Try it now · no signup</p>
          <h2 id="demo-title" className="mt-1 text-3xl font-extrabold sm:text-4xl">Bull or Bear in 30 seconds</h2>
          <p className="mt-3 text-muted">Look at the chart. Will the price be higher or lower a few days from now? Call it, build a streak, and see how hard timing the market really is.</p>
          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li>⬆️ / ⬇️ arrow keys work too</li>
            <li>🔥 Streaks multiply your points (up to 5×)</li>
          </ul>
        </div>
        <div className="glass relative overflow-hidden rounded-3xl p-5 shadow-2xl">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold">
            <span className="tabular-nums">Score {score}</span>
            <span className={cn('flex items-center gap-1 tabular-nums', streak > 1 ? 'text-coin' : 'text-muted')}>
              <Flame className="h-4 w-4" /> {streak}× streak
            </span>
            <span className="tabular-nums text-muted">{Math.ceil(timeLeft)}s</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className={cn('h-full rounded-full transition-[width] duration-100 ease-linear', timeLeft < 8 ? 'bg-loss' : 'bg-brand')} style={{ width: `${(timeLeft / DURATION) * 100}%` }} />
          </div>
          <div className="relative">
            <CandleChart bars={shown} revealFrom={phase === 'revealing' ? VISIBLE : undefined} />
            <AnimatePresence>
              {last && (
                <motion.div
                  key="verdict"
                  initial={{ opacity: 0, scale: 0.6, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn('absolute left-1/2 top-4 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg', last.right ? 'bg-gain' : 'bg-loss')}
                  role="status"
                >
                  {last.right ? '✓ Correct!' : '✗ Not this time'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="gain" size="lg" disabled={phase !== 'playing'} onClick={() => call('BULL')} aria-label="Bull: price goes up">
              <TrendingUp className="h-5 w-5" /> Bull
            </Button>
            <Button variant="loss" size="lg" disabled={phase !== 'playing'} onClick={() => call('BEAR')} aria-label="Bear: price goes down">
              <TrendingDown className="h-5 w-5" /> Bear
            </Button>
          </div>
          <AnimatePresence>
            {(phase === 'idle' || phase === 'over') && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-bg/80 p-6 text-center backdrop-blur-sm">
                {phase === 'idle' ? (
                  <>
                    <motion.span className="text-5xl" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>🐂</motion.span>
                    <p className="text-lg font-bold">Ready? You have 30 seconds.</p>
                    <Button size="lg" onClick={start}><Play className="h-5 w-5 fill-current" /> Start demo</Button>
                  </>
                ) : (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="flex flex-col items-center gap-3">
                    <p className="text-sm text-muted">Time&apos;s up!</p>
                    <p className="font-display text-5xl font-extrabold">{score}</p>
                    <p className="text-sm text-muted">{correct} of {calls} calls right</p>
                    <p className="max-w-xs text-sm"><strong>What you learned:</strong> even with a chart, short-term moves are close to a coin flip. That&apos;s why long-term investing beats timing.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button onClick={() => playGame('bull-or-bear')}>Sign up to play the full game</Button>
                      <Button variant="outline" onClick={start}><RotateCcw className="h-4 w-4" /> Again</Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

