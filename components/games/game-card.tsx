'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Lock, Play, Sparkles, Zap } from 'lucide-react';
import { TiltCard } from '@/components/motion/tilt-card';
import { Badge } from '@/components/ui/badge';
import { useStartGame } from '@/hooks/use-start-game';
import type { GameCardData } from '@/lib/server/catalogue';
import { cn } from '@/lib/utils';

const DIFFICULTY_TONE = { BEGINNER: 'gain', INTERMEDIATE: 'coin', ADVANCED: 'loss' } as const;
const DIFFICULTY_LABEL = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' } as const;

/** The core reusable card: 3D tilt + glow, cover parallax, Play slides up on hover, padlock overlay when locked. */
export function GameCard({ game, className }: { game: GameCardData; className?: string }) {
  const { playGame, pending } = useStartGame();
  const locked = Boolean(game.locked);

  return (
    <TiltCard className={cn('h-full rounded-3xl', className)} glow={`${game.cover.from}55`}>
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-shadow duration-300 group-hover:shadow-2xl">
        <Link href={`/games/${game.slug}`} className="relative block h-40 overflow-hidden" aria-label={`${game.title} details`}>
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${game.cover.from}, ${game.cover.to})` }} />
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:18px_18px]" />
          <motion.span
            className="absolute bottom-3 right-4 text-6xl drop-shadow-xl transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-6 group-hover:scale-110"
            aria-hidden
          >
            {game.cover.emoji}
          </motion.span>
          <div className="absolute left-3 top-3 flex gap-1.5">
            {game.isNew && (
              <Badge tone="coin" className="bg-white/90 text-amber-600 shadow">
                <Sparkles className="h-3 w-3" /> New
              </Badge>
            )}
            {game.bestScore !== undefined && <Badge className="bg-black/30 text-white backdrop-blur">Best {game.bestScore}</Badge>}
          </div>
        </Link>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold leading-tight">{game.title}</h3>
            <Badge tone={DIFFICULTY_TONE[game.difficulty]}>{DIFFICULTY_LABEL[game.difficulty]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">{game.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {game.skills.slice(0, 3).map((s) => (
              <span key={s} className="rounded-lg bg-surface-2 px-2 py-0.5 text-xs text-muted">{s}</span>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-4 pt-4 text-xs font-medium text-muted">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{game.durationMin[0]}–{game.durationMin[1]} min</span>
            <span className="flex items-center gap-1 text-coin"><Zap className="h-3.5 w-3.5" />{game.xpReward} XP</span>
          </div>
          {game.progress !== undefined && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted"><span>In progress</span><span>{Math.round(game.progress * 100)}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-brand" style={{ width: `${game.progress * 100}%` }} />
              </div>
            </div>
          )}
        </div>
        {/* Play button slides up on hover (always visible on touch) */}
        {!locked && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-0 p-4 transition-transform duration-300 [@media(hover:hover)]:translate-y-full [@media(hover:hover)]:group-hover:translate-y-0">
            <button
              onClick={() => playGame(game.slug)}
              disabled={pending === game.slug}
              className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 font-semibold text-white shadow-lg shadow-brand/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            >
              <Play className="h-4 w-4 fill-current" />
              {pending === game.slug ? 'Loading…' : game.activeSessionId ? 'Continue' : 'Play'}
            </button>
          </div>
        )}
        {locked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-bg/70 p-6 text-center backdrop-blur-[3px]">
            <motion.div initial={{ scale: 0.8 }} whileHover={{ rotate: [0, -12, 12, -6, 0] }} className="grid h-14 w-14 place-items-center rounded-2xl bg-surface shadow-lg">
              <Lock className="h-6 w-6 text-muted" />
            </motion.div>
            <p className="font-semibold">{game.title}</p>
            <p className="text-sm text-muted">{game.locked?.reason}</p>
          </div>
        )}
      </div>
    </TiltCard>
  );
}
