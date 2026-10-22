'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Scale, Sparkles } from 'lucide-react';
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import type { PortfolioBuilderState } from '@/lib/game/engines/portfolio-builder';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RendererProps } from './types';

type Key = 'equity' | 'debt' | 'gold' | 'cash';
const KEYS: Key[] = ['equity', 'debt', 'gold', 'cash'];
const META: Record<Key, { label: string; color: string; note: string }> = {
  equity: { label: 'Equity', color: '#6366f1', note: 'Stocks & equity funds · ~12%/yr, big swings' },
  debt: { label: 'Debt', color: '#14b8a6', note: 'Bonds & debt funds · ~7%/yr, steady' },
  gold: { label: 'Gold', color: '#f59e0b', note: 'Gold ETF · ~8%/yr, hedge against crashes' },
  cash: { label: 'Cash', color: '#94a3b8', note: 'Savings account · ~3.5%/yr, instant access' },
};

/** Animated SVG donut of an allocation. */
function Donut({ alloc, size = 180 }: { alloc: Record<Key, number>; size?: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={KEYS.map((k) => `${META[k].label} ${alloc[k]}%`).join(', ')}>
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgb(var(--surface-2))" strokeWidth="26" />
      {KEYS.map((k) => {
        const len = (alloc[k] / 100) * c;
        const el = (
          <motion.circle
            key={k}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={META[k].color}
            strokeWidth="26"
            transform="rotate(-90 100 100)"
            initial={false}
            animate={{ strokeDasharray: `${len} ${c - len}`, strokeDashoffset: -offset }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        );
        offset += len;
        return el;
      })}
      <text x="100" y="96" textAnchor="middle" className="fill-current font-display text-[22px] font-bold">{alloc.equity}%</text>
      <text x="100" y="118" textAnchor="middle" className="fill-[rgb(var(--muted))] text-[11px]">equity</text>
    </svg>
  );
}

/** Changing one slider rebalances the others proportionally so the total stays 100. */
function rebalanceTo(alloc: Record<Key, number>, key: Key, value: number): Record<Key, number> {
  const next = { ...alloc, [key]: value };
  const others = KEYS.filter((k) => k !== key);
  const remaining = 100 - value;
  const otherSum = others.reduce((s, k) => s + alloc[k], 0);
  let assigned = 0;
  others.forEach((k, i) => {
    if (i === others.length - 1) next[k] = remaining - assigned;
    else {
      next[k] = otherSum ? Math.round((alloc[k] / otherSum) * remaining) : Math.round(remaining / others.length);
      assigned += next[k];
    }
  });
  if (next[others[others.length - 1]] < 0) return alloc;
  return next;
}

export function PortfolioBuilderBoard({ state, actions, onAction, busy }: RendererProps<PortfolioBuilderState>) {
  const p = state.persona;
  const [alloc, setAlloc] = useState<Record<Key, number>>({ equity: 50, debt: 30, gold: 10, cash: 10 });
  const [sip, setSip] = useState(Math.round(p.monthlyBudget / 2 / 50000) * 50000);
  const chartData = state.history.map((h) => ({ year: `Y${h.year}`, Value: Math.round(h.value / 100), Invested: Math.round(h.invested / 100) }));

  const persona = (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-border bg-gradient-to-br from-violet-500/10 to-pink-500/10 p-5">
      <div className="flex items-center gap-4">
        <motion.span className="text-5xl" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} aria-hidden>{p.emoji}</motion.span>
        <div>
          <p className="font-display text-xl font-bold">{p.name}, {p.age}</p>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', p.risk === 'Aggressive' ? 'bg-loss/15 text-loss' : p.risk === 'Moderate' ? 'bg-coin/15 text-coin' : 'bg-gain/15 text-gain')}>{p.risk} investor</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">{p.story}</p>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-2xl bg-surface/70 p-2.5"><dt className="text-xs text-muted">Goal</dt><dd className="font-semibold">{formatINR(p.goal)}</dd></div>
        <div className="rounded-2xl bg-surface/70 p-2.5"><dt className="text-xs text-muted">Starts with</dt><dd className="font-semibold">{formatINR(p.lumpSum)}</dd></div>
        <div className="rounded-2xl bg-surface/70 p-2.5"><dt className="text-xs text-muted">Can invest</dt><dd className="font-semibold">{formatINR(p.monthlyBudget)}/mo</dd></div>
      </dl>
      <p className="mt-3 text-sm"><Sparkles className="mr-1 inline h-4 w-4 text-brand" />{p.goalLabel}</p>
    </motion.div>
  );

  const chart = chartData.length > 1 && (
    <div className="rounded-3xl border border-border bg-surface p-4">
      <p className="mb-2 text-sm font-semibold">Portfolio value vs money put in (₹, virtual)</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pbVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={11} stroke="rgb(var(--muted))" />
            <YAxis tickLine={false} axisLine={false} fontSize={11} width={80} stroke="rgb(var(--muted))" tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={{ borderRadius: 12, background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="Value" stroke="#8b5cf6" strokeWidth={3} fill="url(#pbVal)" animationDuration={1200} />
            <Area type="monotone" dataKey="Invested" stroke="rgb(var(--muted))" strokeDasharray="5 5" fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (state.phase === 'ALLOCATE') {
    return (
      <div className="space-y-5">
        {persona}
        <div className="grid gap-5 rounded-3xl border border-border bg-surface p-5 md:grid-cols-[200px_1fr]">
          <div className="flex flex-col items-center justify-center">
            <Donut alloc={alloc} />
            <p className="mt-1 text-xs text-muted">Total: 100%</p>
          </div>
          <div className="space-y-4">
            {KEYS.map((k) => (
              <div key={k}>
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor={`alloc-${k}`} className="flex items-center gap-2 font-semibold"><span className="h-3 w-3 rounded-full" style={{ background: META[k].color }} />{META[k].label}</label>
                  <span className="font-semibold tabular-nums">{alloc[k]}%</span>
                </div>
                <input id={`alloc-${k}`} type="range" min={0} max={100} value={alloc[k]} onChange={(e) => setAlloc((a) => rebalanceTo(a, k, Number(e.target.value)))} className="mt-1 w-full" style={{ accentColor: META[k].color }} />
                <p className="text-xs text-muted">{META[k].note}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <label htmlFor="sip" className="font-semibold">Monthly SIP</label>
            <span className="font-display text-lg font-bold text-brand">{formatINR(sip)}</span>
          </div>
          <input id="sip" type="range" min={0} max={p.monthlyBudget} step={50000} value={sip} onChange={(e) => setSip(Number(e.target.value))} className="mt-2 w-full accent-[rgb(var(--brand))]" />
          <p className="text-xs text-muted">{p.name} can afford up to {formatINR(p.monthlyBudget)} a month. More SIP = more compounding.</p>
        </div>
        <Button size="lg" className="w-full" disabled={busy || !actions.some((a) => a.type === 'ALLOCATE')} onClick={() => onAction('ALLOCATE', { ...alloc, sip })}>
          <Lock className="h-4 w-4" /> Lock it in and fast-forward {state.midYear ?? 5} years
        </Button>
      </div>
    );
  }

  const target = state.allocation!;
  const drift = state.driftAtReview!;
  return (
    <div className="space-y-5">
      {persona}
      {chart}
      {state.phase === 'REVIEW' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border-2 border-brand/40 bg-surface p-5">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Scale className="h-5 w-5 text-brand" /> Year {state.midYear ?? 5} check-up</h2>
          <p className="mt-1 text-sm text-muted">Markets moved, so your mix drifted. Rebalance back to plan, or hold?</p>
          <div className="mt-4 space-y-2">
            {KEYS.map((k) => (
              <div key={k} className="grid grid-cols-[70px_1fr_90px] items-center gap-3 text-sm">
                <span className="font-semibold">{META[k].label}</span>
                <div className="relative h-3 rounded-full bg-surface-2">
                  <motion.span className="absolute inset-y-0 left-0 rounded-full" style={{ background: META[k].color }} initial={{ width: `${target[k]}%` }} animate={{ width: `${drift[k]}%` }} transition={{ duration: 1.2 }} />
                  <span className="absolute inset-y-[-3px] w-0.5 bg-fg" style={{ left: `${target[k]}%` }} title="Target" />
                </div>
                <span className="text-right tabular-nums text-muted">{target[k]}% → <strong className="text-fg">{drift[k]}%</strong></span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button size="lg" disabled={busy || !actions.some((a) => a.type === 'REBALANCE')} onClick={() => onAction('REBALANCE')}>⚖️ Rebalance</Button>
            <Button size="lg" variant="outline" disabled={busy || !actions.some((a) => a.type === 'HOLD')} onClick={() => onAction('HOLD')}>🧘 Hold</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
