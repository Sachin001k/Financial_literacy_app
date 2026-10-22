'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Flame, Play, Timer } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { useStartGame } from '@/hooks/use-start-game';
import { api, queryKeys } from '@/lib/api';
import { getGame } from '@/lib/content/games';

interface DailyResponse {
  daily: { date: string; gameSlug: string; title: string; blurb: string; xpReward: number; endsAt: string; completed: boolean };
}

function useCountdown(endsAt?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return '';
  const ms = Math.max(0, Date.parse(endsAt) - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function DailyChallengeBanner() {
  const { user, me } = useAuth();
  const { playGame, pending } = useStartGame();
  const { data } = useQuery({ queryKey: [...queryKeys.daily, user?.id], queryFn: () => api<DailyResponse>('/daily-challenge') });
  const countdown = useCountdown(data?.daily.endsAt);
  if (!data) return <div className="skeleton h-36" />;
  const d = data.daily;
  const game = getGame(d.gameSlug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8"
      style={{ background: `linear-gradient(120deg, ${game?.cover.from ?? '#6366f1'}, ${game?.cover.to ?? '#22c55e'})` }}
    >
      <motion.span aria-hidden className="absolute -right-4 -top-6 text-[9rem] opacity-25" animate={{ rotate: [0, 8, 0], y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity }}>
        {game?.cover.emoji}
      </motion.span>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80">
            <Flame className="h-4 w-4" /> Daily challenge
            {me && me.progress.currentStreak > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5">{me.progress.currentStreak}-day streak</span>}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{d.title}</h2>
          <p className="mt-1 max-w-lg text-sm text-white/85">{d.blurb}</p>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold tabular-nums">
            <Timer className="h-4 w-4" /> Ends in {countdown}
          </p>
        </div>
        {d.completed ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white/20 px-5 py-3 font-semibold backdrop-blur">
            <CheckCircle2 className="h-5 w-5" /> Done for today
          </div>
        ) : (
          <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90" loading={pending === d.gameSlug} onClick={() => playGame(d.gameSlug, { daily: true })}>
            <Play className="h-5 w-5 fill-current" /> Play · +{d.xpReward} XP
          </Button>
        )}
      </div>
    </motion.div>
  );
}
