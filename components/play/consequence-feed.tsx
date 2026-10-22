'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Lightbulb, Newspaper, Sparkles, Zap } from 'lucide-react';
import type { GameEvent } from '@/lib/game/types';
import { cn } from '@/lib/utils';

export interface FeedItem extends GameEvent {
  id: number;
}

const STYLE: Record<GameEvent['kind'], { icon: typeof Zap; cls: string; label: string }> = {
  CONSEQUENCE: { icon: Sparkles, cls: 'border-border bg-surface', label: 'What happened' },
  MARKET_NEWS: { icon: Newspaper, cls: 'border-sky-400/40 bg-sky-400/10', label: 'News' },
  TIP: { icon: Lightbulb, cls: 'border-brand/30 bg-brand-soft/60', label: 'Tip' },
  SCORE: { icon: Zap, cls: 'border-gain/40 bg-gain/10', label: 'Score' },
  WALLET: { icon: Coins, cls: 'border-coin/40 bg-coin/10', label: 'Money' },
};

/** Animated feed of consequences, newest first. Gains/losses carry +/− signs, not just colour. */
export function ConsequenceFeed({ items, className }: { items: FeedItem[]; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-live="polite" aria-label="Game feed">
      <AnimatePresence initial={false}>
        {items.slice(0, 8).map((e) => {
          const s = STYLE[e.kind];
          const Icon = s.icon;
          const signed = e.delta !== undefined && e.kind !== 'SCORE' && e.delta !== 0;
          return (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className={cn('flex items-start gap-2.5 rounded-2xl border p-3 text-sm', s.cls)}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-label={s.label} />
              <p className="flex-1 leading-snug">{e.message}</p>
              {e.kind === 'SCORE' && e.delta !== undefined && e.delta > 0 && e.message.indexOf('Score') !== 0 && (
                <span className="shrink-0 font-bold text-gain">+{e.delta}</span>
              )}
              {signed && e.kind === 'CONSEQUENCE' && (
                <span className={cn('shrink-0 font-bold', e.delta! > 0 ? 'text-gain' : 'text-loss')}>{e.delta! > 0 ? '▲' : '▼'}</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
