'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SeededRandom } from '@/lib/game/seeded-random';
import { useReducedMotionSafe } from '@/components/providers/use-reduced-motion';

const W = 520;
const H = 220;
const N = 40;

/** A line chart that draws itself, then keeps ticking with a new point every ~800ms. */
export function AnimatedTicker() {
  const reduce = useReducedMotionSafe();
  const rng = useMemo(() => new SeededRandom(42), []);
  const [points, setPoints] = useState<number[]>(() => {
    const r = new SeededRandom(7);
    const out: number[] = [100];
    for (let i = 1; i < N; i++) out.push(Math.max(40, out[i - 1] * (1 + r.normal(0.006, 0.03))));
    return out;
  });

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setPoints((p) => {
        const last = p[p.length - 1];
        const next = Math.max(40, last * (1 + rng.normal(0.004, 0.03)));
        return [...p.slice(1), next];
      });
    }, 800);
    return () => clearInterval(id);
  }, [reduce, rng]);

  const min = Math.min(...points) * 0.95;
  const max = Math.max(...points) * 1.05;
  const x = (i: number) => (i / (N - 1)) * W;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${d} L${W},${H} L0,${H} Z`;
  const last = points[points.length - 1];
  const change = (last - points[0]) / points[0];
  const up = change >= 0;

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-5 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted">NIFTYIDX · simulated</p>
          <p className="font-display text-2xl font-bold tabular-nums">₹{(last * 2.5).toFixed(2)}</p>
        </div>
        <motion.span
          key={up ? 'up' : 'down'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-full px-2.5 py-1 text-sm font-semibold ${up ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss'}`}
        >
          {up ? '▲' : '▼'} {(change * 100).toFixed(2)}%
        </motion.span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full overflow-visible" role="img" aria-label="Animated sample price chart">
        <defs>
          <linearGradient id="tickerFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="rgb(var(--border))" strokeDasharray="4 6" />
        ))}
        <motion.path d={area} fill="url(#tickerFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }} />
        <motion.path
          d={d}
          fill="none"
          stroke="rgb(var(--brand))"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
        />
        <circle cx={x(N - 1)} cy={y(last)} r={6} fill="rgb(var(--brand))" />
        <circle cx={x(N - 1)} cy={y(last)} r={6} fill="rgb(var(--brand))" className="origin-center animate-pulse-ring" style={{ transformBox: 'fill-box' }} />
      </svg>
    </div>
  );
}
