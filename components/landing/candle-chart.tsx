'use client';

import { motion } from 'framer-motion';
import type { Bar } from '@/lib/content/market';

/** Minimal SVG candlestick chart. Hollow up-candles + filled down-candles so colour is not the only signal. */
export function CandleChart({ bars, revealFrom, height = 200, label = 'Price chart' }: { bars: Bar[]; revealFrom?: number; height?: number; label?: string }) {
  const W = 600;
  const H = height;
  const pad = 8;
  const min = Math.min(...bars.map((b) => b.low));
  const max = Math.max(...bars.map((b) => b.high));
  const step = (W - pad * 2) / bars.length;
  const y = (v: number) => pad + (H - pad * 2) * (1 - (v - min) / Math.max(1, max - min));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img" aria-label={label}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="rgb(var(--border))" strokeDasharray="3 6" />
      ))}
      {revealFrom !== undefined && revealFrom < bars.length && (
        <rect x={pad + revealFrom * step - 2} y={0} width={W - (pad + revealFrom * step) + 2} height={H} fill="rgb(var(--brand) / 0.07)" />
      )}
      {bars.map((b, i) => {
        const up = b.close >= b.open;
        const cx = pad + i * step + step / 2;
        const color = up ? 'rgb(var(--gain))' : 'rgb(var(--loss))';
        const top = y(Math.max(b.open, b.close));
        const bodyH = Math.max(2, Math.abs(y(b.open) - y(b.close)));
        const isNew = revealFrom !== undefined && i >= revealFrom;
        return (
          <motion.g
            key={`${b.date}-${i}`}
            initial={{ opacity: 0, scaleY: 0.3 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: isNew ? (i - (revealFrom ?? 0)) * 0.12 : Math.min(i * 0.015, 0.4), type: 'spring', stiffness: 200, damping: 18 }}
            style={{ transformOrigin: `${cx}px ${top + bodyH / 2}px` }}
          >
            <line x1={cx} x2={cx} y1={y(b.high)} y2={y(b.low)} stroke={color} strokeWidth={1.5} />
            <rect x={cx - step * 0.32} y={top} width={step * 0.64} height={bodyH} rx={1.5} fill={up ? 'rgb(var(--surface))' : color} stroke={color} strokeWidth={1.5} />
          </motion.g>
        );
      })}
    </svg>
  );
}
