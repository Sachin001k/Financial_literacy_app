'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';
import { Avatar } from '@/components/layout/navbar';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { api, queryKeys } from '@/lib/api';
import { GAMES } from '@/lib/content/games';
import { formatNumber } from '@/lib/format';
import type { LeaderboardEntry } from '@/lib/server/leaderboard';
import { cn } from '@/lib/utils';

interface BoardResponse {
  board: string;
  entries: LeaderboardEntry[];
  me: { score: number; rank: number } | null;
}

const BOARDS = [{ value: 'weekly-xp', label: '⚡ Weekly XP' }, ...GAMES.map((g) => ({ value: g.slug, label: `${g.cover.emoji} ${g.title}` }))];
const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_HEIGHT = ['h-32', 'h-24', 'h-20'];

function Podium({ entries, unit }: { entries: LeaderboardEntry[]; unit: string }) {
  return (
    <div className="mb-8 grid grid-cols-3 items-end gap-3 sm:gap-6">
      {PODIUM_ORDER.map((idx, col) => {
        const e = entries[idx];
        if (!e) return <div key={col} />;
        return (
          <motion.div
            key={e.userId}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.15 + col * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <motion.span className="mb-1 text-3xl" animate={idx === 0 ? { y: [0, -6, 0] } : undefined} transition={{ duration: 2, repeat: Infinity }} aria-hidden>
              {MEDALS[idx]}
            </motion.span>
            <Avatar name={e.displayName} url={e.avatarUrl} size={idx === 0 ? 64 : 52} />
            <p className="mt-2 w-full truncate text-sm font-bold">{e.displayName}</p>
            <p className="text-xs text-muted tabular-nums">{formatNumber(e.score)} {unit}</p>
            <div className={cn('mt-3 w-full rounded-t-2xl bg-gradient-to-t', PODIUM_HEIGHT[idx], idx === 0 ? 'from-amber-500/30 to-amber-300/60' : idx === 1 ? 'from-slate-400/30 to-slate-300/60' : 'from-orange-700/25 to-orange-400/50')}>
              <span className="block pt-2 font-display text-2xl font-extrabold text-fg/70">#{e.rank}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function LeaderboardView() {
  const { user, me, openGate } = useAuth();
  const [board, setBoard] = useState('weekly-xp');
  const { data, isLoading, isError } = useQuery({
    queryKey: [...queryKeys.leaderboard(board), user?.id],
    queryFn: () => api<BoardResponse>(`/leaderboards/${board}`),
  });
  const unit = board === 'weekly-xp' ? 'XP' : 'pts';
  const entries = data?.entries ?? [];

  return (
    <div className="container-page max-w-4xl py-10 pb-28">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
        <motion.span className="inline-block text-5xl" initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} aria-hidden>🏆</motion.span>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Leaderboard</h1>
        <p className="mt-2 text-muted">{board === 'weekly-xp' ? 'Most XP earned this week (resets Monday).' : 'Best single score in this game, all time.'}</p>
      </motion.div>

      <div className="-mx-4 mb-8 overflow-x-auto px-4 [scrollbar-width:none]">
        <div role="tablist" className="mx-auto flex w-max gap-1 rounded-2xl bg-surface-2 p-1">
          {BOARDS.map((b) => (
            <button
              key={b.value}
              role="tab"
              aria-selected={board === b.value}
              onClick={() => setBoard(b.value)}
              className={cn('relative whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors', board === b.value ? 'text-fg' : 'text-muted hover:text-fg')}
            >
              {board === b.value && <motion.span layoutId="lb-tab" className="absolute inset-0 rounded-xl bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={board} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-16" />)}</div>
          ) : isError ? (
            <p className="rounded-3xl border border-border bg-surface p-8 text-center text-muted">Could not load the leaderboard. Check your connection and try again.</p>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border py-16 text-center">
              <Users className="h-10 w-10 text-muted" />
              <p className="font-semibold">No scores yet</p>
              <p className="text-sm text-muted">Be the first on the board — play a game!</p>
            </div>
          ) : (
            <>
              <Podium entries={entries} unit={unit} />
              <ol className="space-y-2">
                {entries.slice(3).map((e, i) => (
                  <motion.li
                    key={e.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.6) }}
                    className={cn('flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3', e.userId === user?.id && 'border-brand bg-brand-soft/50')}
                  >
                    <span className="w-8 text-center font-display font-bold text-muted tabular-nums">#{e.rank}</span>
                    <Avatar name={e.displayName} url={e.avatarUrl} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{e.displayName}{e.userId === user?.id && ' (you)'}</p>
                      <p className="text-xs text-muted">Level {e.level}</p>
                    </div>
                    <span className="font-bold tabular-nums">{formatNumber(e.score)} <span className="text-xs font-medium text-muted">{unit}</span></span>
                  </motion.li>
                ))}
              </ol>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MyRankRow */}
      <motion.div initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 120, delay: 0.4 }} className="fixed inset-x-0 bottom-4 z-40 px-4">
        <div className="glass mx-auto flex max-w-4xl items-center gap-4 rounded-2xl px-4 py-3 shadow-2xl">
          {user ? (
            <>
              <Trophy className="h-5 w-5 text-coin" />
              <Avatar name={me?.displayName ?? 'You'} url={me?.avatarUrl} size={36} />
              <p className="flex-1 font-semibold">{data?.me ? <>You&apos;re <span className="text-brand">#{data.me.rank}</span></> : 'You’re not on this board yet'}</p>
              {data?.me && <span className="font-bold tabular-nums">{formatNumber(data.me.score)} <span className="text-xs text-muted">{unit}</span></span>}
            </>
          ) : (
            <>
              <p className="flex-1 text-sm font-medium">Sign up to get on the leaderboard.</p>
              <Button size="sm" onClick={() => openGate('signup')}>Join free</Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
