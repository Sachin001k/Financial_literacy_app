'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lock, Play, RotateCcw, Trophy } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStartGame } from '@/hooks/use-start-game';
import { api, queryKeys } from '@/lib/api';
import type { GameCardData } from '@/lib/server/catalogue';

/** Gated Play button with per-user lock, continue and best-score state. */
export function PlayPanel({ game: initial }: { game: GameCardData }) {
  const { user } = useAuth();
  const { playGame, pending } = useStartGame();
  const { data } = useQuery({
    queryKey: [...queryKeys.game(initial.slug), user?.id],
    queryFn: () => api<{ game: GameCardData }>(`/games/${initial.slug}`),
    enabled: Boolean(user),
  });
  const game = data?.game ?? initial;
  const busy = pending === game.slug;

  return (
    <Card className="sticky top-24 p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Your goal</p>
      <p className="mt-1 font-semibold">{game.goal}</p>
      {game.bestScore !== undefined && (
        <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 flex items-center gap-2 rounded-2xl bg-coin/10 px-3 py-2 text-sm font-semibold text-coin">
          <Trophy className="h-4 w-4" /> Your best: {game.bestScore}
        </motion.p>
      )}
      <div className="mt-5 space-y-2">
        {game.locked ? (
          <div className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4 text-sm">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
            <div>
              <p className="font-semibold">Locked</p>
              <p className="text-muted">{game.locked.reason}</p>
              {initial.unlockLesson && (
                <Link href={`/learn`} className="mt-2 inline-block font-semibold text-brand hover:underline">Go to lessons →</Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <Button size="lg" className="w-full" loading={busy} onClick={() => playGame(game.slug)}>
              <Play className="h-5 w-5 fill-current" /> {game.activeSessionId ? 'Continue game' : 'Play now'}
            </Button>
            {game.activeSessionId && (
              <Button variant="ghost" className="w-full" disabled={busy} onClick={() => playGame(game.slug, { fresh: true })}>
                <RotateCcw className="h-4 w-4" /> Start over
              </Button>
            )}
          </>
        )}
      </div>
      {!user && <p className="mt-3 text-center text-xs text-muted">Free account needed to play and save progress.</p>}
    </Card>
  );
}
