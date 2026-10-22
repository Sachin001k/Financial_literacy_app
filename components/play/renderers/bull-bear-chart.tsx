'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowUp, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Bar } from '@/lib/content/market';
import type { BullBearState } from '@/lib/game/engines/bull-or-bear';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { shouldIgnoreGameKey } from '../keyboard';
import type { RendererProps } from './types';

/** Lightweight SVG candlestick chart. Candles draw in one by one; `highlightLast` glows the revealed candle. */
export function Candles({ bars, highlightLast = false, height = 260, className }: { bars: Bar[]; highlightLast?: boolean; height?: number; className?: string }) {
  const width = 640;
  const pad = 12;
  const lo = Math.min(...bars.map((b) => b.low));
  const hi = Math.max(...bars.map((b) => b.high));
  const span = hi - lo || 1;
  const y = (v: number) => pad + ((hi - v) / span) * (height - pad * 2);
  const slot = (width - pad * 2) / bars.length;
  const bodyW = Math.max(4, slot * 0.6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('h-auto w-full', className)} role="img" aria-label={`Candlestick chart, ${bars.length} days, last close ${formatINR(bars[bars.length - 1].close)}`}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} x2={width} y1={pad + f * (height - pad * 2)} y2={pad + f * (height - pad * 2)} stroke="rgb(var(--border))" strokeDasharray="4 6" />
      ))}
      {bars.map((b, i) => {
        const up = b.close >= b.open;
        const color = up ? 'rgb(var(--gain))' : 'rgb(var(--loss))';
        const cx = pad + slot * i + slot / 2;
        const top = y(Math.max(b.open, b.close));
        const bodyH = Math.max(2, Math.abs(y(b.open) - y(b.close)));
        const isLast = highlightLast && i === bars.length - 1;
        return (
          <motion.g
            key={`${b.date}-${i}`}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: isLast ? 0.3 : i * 0.025, duration: isLast ? 0.6 : 0.3, ease: 'easeOut' }}
            style={{ transformOrigin: `${cx}px ${y((b.open + b.close) / 2)}px` }}
          >
            {isLast && <rect x={cx - slot / 2} y={0} width={slot} height={height} fill={color} opacity={0.12} rx={6} />}
            <line x1={cx} x2={cx} y1={y(b.high)} y2={y(b.low)} stroke={color} strokeWidth={1.5} />
            <rect x={cx - bodyW / 2} y={top} width={bodyW} height={bodyH} rx={1.5} fill={up ? color : color} fillOpacity={up ? 0.9 : 1} stroke={color} />
          </motion.g>
        );
      })}
    </svg>
  );
}

export function BullBearChart({ state, onAction, busy }: RendererProps<BullBearState>) {
  const askedRound = useRef<number | null>(null);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    if (askedRound.current !== null && state.round === askedRound.current + 1 && state.lastReveal) {
      setRevealing(true);
      askedRound.current = null;
    }
  }, [state.round, state.lastReveal]);

  const call = (type: 'BULL' | 'BEAR') => {
    if (busy || revealing || !state.current) return;
    askedRound.current = state.round;
    onAction(type);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreGameKey(e)) return;
      if (revealing && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) {
        if (!state.current) return;
        e.preventDefault();
        setRevealing(false);
      } else if (!revealing && !busy && state.current && (e.key === 'ArrowUp' || e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        call('BULL');
      } else if (!revealing && !busy && state.current && (e.key === 'ArrowDown' || e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        call('BEAR');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const r = state.lastReveal;
  const showReveal = revealing && r;
  const bars = showReveal ? [...r.bars, r.next] : state.current?.bars;
  const headline = showReveal ? r.headline : state.current?.headline;
  if (!bars || !headline) return null;
  const last = bars[bars.length - 1];
  const first = bars[0];
  const trend = (last.close - first.open) / first.open;

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div key={headline} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-3 rounded-3xl border border-sky-400/40 bg-sky-400/10 p-4">
          <Newspaper className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">Breaking</p>
            <p className="font-semibold">{headline}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="rounded-3xl border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">{showReveal ? 'What happened next' : 'Last 20 days'}</span>
          <span className="tabular-nums text-muted">
            {formatINR(last.close, { decimals: true })} · <span className={trend >= 0 ? 'text-gain' : 'text-loss'}>{trend >= 0 ? '▲ +' : '▼ '}{(trend * 100).toFixed(1)}%</span>
          </span>
        </div>
        <Candles key={`${state.round}-${showReveal ? 'r' : 'q'}`} bars={bars} highlightLast={Boolean(showReveal)} />
      </div>

      <AnimatePresence mode="wait">
        {showReveal ? (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={cn('rounded-3xl border-2 p-5', r.correct ? 'border-gain/50 bg-gain/10' : 'border-loss/50 bg-loss/10')}>
            <p className="font-display text-xl font-bold">
              {r.up ? '📈 It went UP' : '📉 It went DOWN'} — {r.correct ? 'you called it!' : 'not this time.'}
            </p>
            <p className="mt-1 text-muted">{r.explanation}</p>
            {state.current && (
              <Button className="mt-4 w-full" size="lg" onClick={() => setRevealing(false)}>
                Next chart <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div key="ask" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-4">
            <motion.button whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.96 }} disabled={busy} onClick={() => call('BULL')} className="flex flex-col items-center gap-1 rounded-3xl bg-gain p-6 text-white shadow-xl shadow-gain/30 disabled:opacity-60">
              <span className="text-4xl" aria-hidden>🐂</span>
              <span className="flex items-center gap-1 font-display text-xl font-extrabold"><ArrowUp className="h-5 w-5" /> Bull</span>
              <span className="text-xs text-white/80">Price goes up · ↑</span>
            </motion.button>
            <motion.button whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.96 }} disabled={busy} onClick={() => call('BEAR')} className="flex flex-col items-center gap-1 rounded-3xl bg-loss p-6 text-white shadow-xl shadow-loss/30 disabled:opacity-60">
              <span className="text-4xl" aria-hidden>🐻</span>
              <span className="flex items-center gap-1 font-display text-xl font-extrabold"><ArrowDown className="h-5 w-5" /> Bear</span>
              <span className="text-xs text-white/80">Price goes down · ↓</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {state.streak > 1 && !showReveal && (
        <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center font-semibold text-coin">🔥 {state.streak} in a row — streak multiplier active!</motion.p>
      )}
    </div>
  );
}
