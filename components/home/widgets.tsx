'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CheckCircle2, Flame, Gamepad2, Play, Timer, Trophy, Wallet } from 'lucide-react';
import { Avatar } from '@/components/layout/navbar';
import { CountUp } from '@/components/motion/count-up';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useStartGame } from '@/hooks/use-start-game';
import { queryKeys } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { getGame } from '@/lib/content/games';
import type { HomeData } from './types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeBanner({ me }: { me: HomeData['me'] }) {
  const [hello, setHello] = useState('Hello');
  useEffect(() => setHello(greeting()), []);
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-violet-600 to-emerald-500 p-6 text-white shadow-xl shadow-brand/20 sm:p-8">
      <motion.div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.div aria-hidden className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-white/10" animate={{ y: [0, -14, 0] }} transition={{ duration: 4, repeat: Infinity }} />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
          <Avatar name={me.displayName} url={me.avatarUrl} size={72} />
        </motion.div>
        <div className="flex-1">
          <p className="text-sm opacity-80">{hello},</p>
          <h1 className="text-3xl font-extrabold">{me.displayName} 👋</h1>
          <p className="mt-1 text-sm opacity-90">
            {me.progress.currentStreak > 0 ? `You’re on a ${me.progress.currentStreak}-day streak. Keep it going!` : 'Play a game today to start a streak.'}
          </p>
        </div>
        <Link href="/games">
          <Button size="lg" className="bg-white text-brand shadow-lg hover:bg-white/90">
            <Gamepad2 className="h-5 w-5" /> Start playing
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function ContinueGameCard({ game }: { game: NonNullable<HomeData['continueGame']> }) {
  return (
    <Link href={`/play/${game.sessionId}`} className="group block h-full">
      <Card className="flex h-full items-center gap-4 transition hover:-translate-y-1 hover:shadow-xl">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-3xl shadow-lg transition group-hover:rotate-6" style={{ background: `linear-gradient(135deg, ${game.cover.from}, ${game.cover.to})` }}>
          {game.cover.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Continue game</p>
          <p className="truncate font-bold">{game.title}</p>
          <Progress value={game.progress} className="mt-2 h-2" label="Game progress" />
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition group-hover:scale-110"><Play className="h-4 w-4 fill-current" /></span>
      </Card>
    </Link>
  );
}

export function ContinueLessonCard({ lesson }: { lesson: NonNullable<HomeData['continueLesson']> }) {
  return (
    <Link href={`/learn/${lesson.category}/${lesson.slug}`} className="group block h-full">
      <Card className="flex h-full items-center gap-4 transition hover:-translate-y-1 hover:shadow-xl">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gain/15 text-gain transition group-hover:-rotate-6"><BookOpen className="h-7 w-7" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Continue learning · {lesson.readMinutes} min</p>
          <p className="truncate font-bold">{lesson.title}</p>
          <p className="truncate text-sm text-muted">{lesson.summary}</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-brand" />
      </Card>
    </Link>
  );
}

/** Counts down to `endsAt`; when it hits zero, refetches so tomorrow's challenge replaces the stale one. */
function useCountdown(endsAt: string) {
  const qc = useQueryClient();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    let expired = false;
    const tick = () => {
      const ms = Math.max(0, Date.parse(endsAt) - Date.now());
      setLeft(ms);
      if (ms === 0 && !expired) {
        expired = true;
        // Small delay so the server's IST date has rolled over
        setTimeout(() => {
          void qc.invalidateQueries({ queryKey: queryKeys.home });
          void qc.invalidateQueries({ queryKey: queryKeys.daily });
        }, 2000);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, qc]);
  if (left === null) return '--:--:--';
  const s = Math.floor(left / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
}

export function DailyChallengeCard({ daily, streak }: { daily: HomeData['daily']; streak: number }) {
  const { playGame, pending } = useStartGame();
  const countdown = useCountdown(daily.endsAt);
  const game = getGame(daily.gameSlug);
  return (
    <Card className="relative h-full overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-coin">Daily challenge</p>
          <p className="mt-1 text-lg font-bold">{game?.cover.emoji} {daily.title}</p>
        </div>
        <div className="flex flex-col items-center" title={`${streak}-day streak`}>
          <motion.div animate={streak > 0 ? { scale: [1, 1.15, 1], rotate: [0, -4, 4, 0] } : {}} transition={{ duration: 1.4, repeat: Infinity }}>
            <Flame className={streak > 0 ? 'h-9 w-9 fill-orange-400 text-orange-500' : 'h-9 w-9 text-muted'} />
          </motion.div>
          <span className="text-xs font-bold">{streak} day{streak === 1 ? '' : 's'}</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">{daily.blurb}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 font-mono text-sm tabular-nums text-muted"><Timer className="h-4 w-4" /> {countdown}</span>
        {daily.completed ? (
          <span className="flex items-center gap-1.5 rounded-xl bg-gain/15 px-3 py-2 text-sm font-semibold text-gain"><CheckCircle2 className="h-4 w-4" /> Done today</span>
        ) : (
          <Button variant="coin" size="sm" onClick={() => playGame(daily.gameSlug, { daily: true })} loading={pending === daily.gameSlug}>
            Play +{daily.xpReward} XP
          </Button>
        )}
      </div>
    </Card>
  );
}

export function LevelProgress({ progress }: { progress: HomeData['me']['progress'] }) {
  const toNext = progress.levelCeil - progress.totalXp;
  return (
    <Card className="h-full">
      <div className="flex items-center gap-4">
        <motion.div initial={{ rotateY: 180, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} className="relative grid h-16 w-16 place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full text-brand" aria-hidden>
            <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill="currentColor" />
          </svg>
          <span className="relative text-2xl font-extrabold text-white">{progress.level}</span>
        </motion.div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Level {progress.level}</p>
          <p className="text-2xl font-extrabold"><CountUp value={progress.totalXp} /> <span className="text-sm font-semibold text-muted">XP</span></p>
        </div>
      </div>
      <Progress value={progress.ratio} className="mt-4 h-3" label="XP to next level" />
      <p className="mt-2 text-xs text-muted">{toNext} XP to level {progress.level + 1}</p>
    </Card>
  );
}

export function WalletCard({ balance }: { balance: number }) {
  return (
    <Card className="relative h-full overflow-hidden">
      <motion.span aria-hidden className="absolute -right-4 -top-4 text-7xl opacity-20" animate={{ rotate: [0, 15, 0], y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity }}>🪙</motion.span>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted"><Wallet className="h-4 w-4" /> Virtual wallet</p>
      <p className="mt-2 text-3xl font-extrabold text-coin"><CountUp value={balance} format={(n) => formatINR(n)} /></p>
      <p className="mt-1 text-xs text-muted">Virtual money earned from games. Not real ₹.</p>
    </Card>
  );
}

export function RecentAchievements({ items }: { items: HomeData['recentAchievements'] }) {
  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-bold"><Trophy className="h-5 w-5 text-coin" /> Latest achievements</p>
        <Link href="/profile" className="text-sm font-semibold text-brand hover:underline">All</Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Finish your first game to unlock your first badge.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {items.map((a, i) => (
            <motion.div
              key={a.code}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: 0.15 * i, type: 'spring', stiffness: 140, damping: 14 }}
              className="flex flex-col items-center rounded-2xl bg-surface-2 p-3 text-center"
            >
              <span className="text-3xl">{a.icon}</span>
              <span className="mt-1 text-xs font-semibold leading-tight">{a.title}</span>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}
