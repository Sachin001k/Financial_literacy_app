'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Home, Lightbulb, RotateCcw, Trophy } from 'lucide-react';
import { burstConfetti, coinRain } from '@/components/motion/confetti';
import { CountUp } from '@/components/motion/count-up';
import { useSound } from '@/components/providers/sound-provider';
import { Button } from '@/components/ui/button';
import type { GameDef } from '@/lib/content/games';
import { formatINR } from '@/lib/format';
import type { FinishedSummary } from '@/lib/game/types';

const STAT_LABELS: Record<string, string> = {
  monthsPlayed: 'Months played',
  savings: 'Savings (₹)',
  loan: 'Loan left (₹)',
  loansTaken: 'Loans taken',
  happiness: 'Happiness',
  trades: 'Trades',
  assetTypes: 'Asset types',
  cagrPct: 'Yearly return %',
  finalValue: 'Final value (₹)',
  maxDrawdownPct: 'Worst drop %',
  panicSells: 'Panic sells',
  correct: 'Correct',
  total: 'Total',
  rounds: 'Rounds',
  bestStreak: 'Best streak',
  persona: 'Persona',
  invested: 'Invested (₹)',
  riskFit: 'Risk fit',
  rebalanced: 'Rebalanced',
  scamsMissed: 'Scams missed',
  falseAlarms: 'False alarms',
};

function formatStat(key: string, v: number | string) {
  if (typeof v === 'number' && (key === 'savings' || key === 'loan' || key === 'finalValue' || key === 'invested')) return formatINR(v * 100);
  if (typeof v === 'number') return v.toLocaleString('en-IN');
  return v;
}

export function GameOverScreen({ game, summary, mission, onReplay, replaying }: { game: GameDef; summary: FinishedSummary; mission: boolean; onReplay: () => void; replaying: boolean }) {
  const { play } = useSound();
  const [levelUpOpen, setLevelUpOpen] = useState(summary.progress.levelUp);
  const stats = Object.entries(summary.stats).filter(([k]) => k !== 'goalReached' && STAT_LABELS[k]);

  // Celebrate once per summary: StrictMode re-runs effects in dev and would double the burst and sound.
  const celebrated = useRef<FinishedSummary | null>(null);
  useEffect(() => {
    if (celebrated.current === summary) return;
    celebrated.current = summary;
    if (summary.progress.levelUp) {
      play('levelup');
      burstConfetti('big');
    } else if (summary.goalReached) {
      play('success');
      burstConfetti('small');
    }
  }, [summary, play]);

  // Delayed coin rain; cleared if the player leaves before it fires.
  useEffect(() => {
    if (summary.progress.coinsEarned <= 0) return;
    const timer = setTimeout(() => {
      coinRain();
      play('coin');
    }, 900);
    return () => clearTimeout(timer);
  }, [summary, play]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }} className="overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
        <div className="relative p-8 text-center text-white" style={{ background: `linear-gradient(135deg, ${game.cover.from}, ${game.cover.to})` }}>
          <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }} className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-3xl bg-white/20 text-5xl backdrop-blur">
            {summary.goalReached ? '🏆' : game.cover.emoji}
          </motion.div>
          <h1 className="text-3xl font-extrabold">{mission ? 'Mission complete!' : summary.goalReached ? 'Goal reached!' : 'Game over'}</h1>
          <p className="mt-1 text-white/85">{mission ? 'You finished your first mission. Your journey starts now.' : summary.goalReached ? 'Brilliant play — you hit the target.' : 'Every run teaches something. Try again to beat your score.'}</p>
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="min-w-0 rounded-2xl bg-white/15 p-2 backdrop-blur sm:p-3">
              <p className="text-[10px] uppercase tracking-wide text-white/75 sm:text-xs">Score</p>
              <CountUp value={summary.finalScore} className="block break-words font-display text-lg font-extrabold tabular-nums sm:text-2xl" />
            </div>
            <div className="min-w-0 rounded-2xl bg-white/15 p-2 backdrop-blur sm:p-3">
              <p className="text-[10px] uppercase tracking-wide text-white/75 sm:text-xs">XP earned</p>
              <CountUp value={summary.progress.xpEarned} format={(n) => `+${Math.round(n)}`} className="block break-words font-display text-lg font-extrabold tabular-nums sm:text-2xl" />
            </div>
            <div className="min-w-0 rounded-2xl bg-white/15 p-2 backdrop-blur sm:p-3">
              <p className="text-[10px] uppercase tracking-wide text-white/75 sm:text-xs">Coins</p>
              <CountUp value={summary.progress.coinsEarned} format={(n) => `+${formatINR(n)}`} className="block break-words font-display text-lg font-extrabold tabular-nums sm:text-2xl" />
            </div>
          </div>
          {summary.progress.streak > 1 && <p className="mt-3 text-sm text-white/85">🔥 {summary.progress.streak}-day streak</p>}
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {summary.progress.newAchievements.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Trophy className="h-5 w-5 text-coin" /> New achievements</h2>
              <div className="flex flex-wrap gap-3" style={{ perspective: 800 }}>
                {summary.progress.newAchievements.map((a, i) => (
                  <motion.div
                    key={a.code}
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.25, type: 'spring', stiffness: 120, damping: 14 }}
                    className="flex items-center gap-2 rounded-2xl border border-coin/40 bg-coin/10 px-4 py-3"
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <span className="font-semibold">{a.title}</span>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-brand/30 bg-brand-soft/50 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Lightbulb className="h-5 w-5 text-brand" /> What you learned</h2>
            <ul className="space-y-2">
              {summary.learnings.map((l, i) => (
                <motion.li key={l} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.12 }} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-0.5 text-brand">✓</span>
                  {l}
                </motion.li>
              ))}
            </ul>
          </section>

          {stats.length > 0 && (
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.map(([k, v], i) => (
                <motion.div key={k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }} className="rounded-2xl bg-surface-2 p-3">
                  <p className="text-xs text-muted">{STAT_LABELS[k]}</p>
                  <p className="font-semibold tabular-nums">{formatStat(k, v)}</p>
                </motion.div>
              ))}
            </section>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {mission ? (
              <Link href="/home" className="flex-1">
                <Button size="lg" className="w-full"><Home className="h-4 w-4" /> Go to my dashboard</Button>
              </Link>
            ) : (
              <Button size="lg" className="flex-1" onClick={onReplay} loading={replaying}>
                <RotateCcw className="h-4 w-4" /> Play again
              </Button>
            )}
            <Link href="/games" className="flex-1">
              <Button size="lg" variant="outline" className="w-full">More games</Button>
            </Link>
            <Link href="/learn" className="flex-1">
              <Button size="lg" variant="secondary" className="w-full"><BookOpen className="h-4 w-4" /> Learn more</Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {levelUpOpen && (
          <motion.div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLevelUpOpen(false)}>
            <motion.div initial={{ scale: 0.3, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 12 }} className="relative rounded-3xl bg-gradient-to-br from-brand via-violet-500 to-amber-400 p-1 shadow-2xl">
              <div className="rounded-[1.6rem] bg-surface px-10 py-8 text-center">
                <motion.div className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 font-display text-4xl font-extrabold text-black shadow-lg" animate={{ rotateY: [0, 360] }} transition={{ duration: 1.2, delay: 0.3 }}>
                  {summary.progress.level}
                </motion.div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand">Level up!</p>
                <p className="mt-1 text-2xl font-extrabold">You reached level {summary.progress.level}</p>
                <Button className="mt-5" onClick={() => setLevelUpOpen(false)}>Awesome</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
