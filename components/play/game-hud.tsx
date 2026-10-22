'use client';

import { motion } from 'framer-motion';
import { Pause, X } from 'lucide-react';
import { CountUp } from '@/components/motion/count-up';
import { Progress } from '@/components/ui/progress';
import type { GameDef } from '@/lib/content/games';
import { cn } from '@/lib/utils';
import type { HudStat } from './hud-stats';

const TONE = { gain: 'text-gain', loss: 'text-loss', coin: 'text-coin', brand: 'text-brand' } as const;

export function GameHUD({ game, score, progressLabel, ratio, stats, onPause, onQuit, disabled }: {
  game: GameDef;
  score: number;
  progressLabel: string;
  ratio: number;
  stats: HudStat[];
  onPause: () => void;
  onQuit: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.header initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl shadow" style={{ background: `linear-gradient(135deg, ${game.cover.from}, ${game.cover.to})` }} aria-hidden>
            {game.cover.emoji}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display font-bold leading-tight">{game.title}</p>
            <p className="text-xs text-muted">{progressLabel} · <span className="font-medium">virtual ₹</span></p>
          </div>
        </div>
        <div className="order-3 flex w-full items-center gap-4 overflow-x-auto sm:order-none sm:ml-auto sm:w-auto">
          {stats.map((s) => (
            <div key={s.label} className="shrink-0 text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted">{s.label}</p>
              <p className={cn('font-semibold tabular-nums', s.tone && TONE[s.tone])}>{s.value}</p>
            </div>
          ))}
          <div className="shrink-0 rounded-xl bg-brand-soft px-3 py-1 text-right">
            <p className="text-[11px] uppercase tracking-wide text-brand/80">Score</p>
            <CountUp value={score} duration={0.6} className="font-display font-bold tabular-nums text-brand" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <button onClick={onPause} disabled={disabled} className="rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-50" aria-label="Pause and leave">
            <Pause className="h-5 w-5" />
          </button>
          <button onClick={onQuit} disabled={disabled} className="rounded-xl p-2 text-muted hover:bg-loss/10 hover:text-loss disabled:opacity-50" aria-label="Quit game">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <Progress value={ratio} className="h-1 rounded-none" barClassName="rounded-none" label="Game progress" />
    </motion.header>
  );
}
