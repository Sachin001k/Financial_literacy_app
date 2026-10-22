'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Progress } from '@/components/ui/progress';
import type { LifeSimState } from '@/lib/game/engines/life-simulator';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ChoicePanel } from '../choice-panel';
import { shouldIgnoreGameKey } from '../keyboard';
import type { RendererProps } from './types';

const PLAN_STYLE: Record<string, { emoji: string; ring: string }> = {
  BALANCED: { emoji: '⚖️', ring: 'hover:border-brand' },
  SAVER: { emoji: '🐷', ring: 'hover:border-gain' },
  TREAT: { emoji: '🍕', ring: 'hover:border-coin' },
  BARE: { emoji: '🥶', ring: 'hover:border-loss' },
};

function mood(h: number) {
  if (h >= 80) return '😄';
  if (h >= 60) return '🙂';
  if (h >= 40) return '😐';
  if (h >= 25) return '😟';
  return '😫';
}

function SplitBar({ hint }: { hint?: string }) {
  const nums = (hint ?? '').match(/(\d+)% needs · (\d+)% wants · (\d+)% savings/);
  if (!nums) return null;
  const [needs, wants, save] = nums.slice(1).map(Number);
  return (
    <div className="mt-3">
      <div className="flex h-2.5 overflow-hidden rounded-full">
        <motion.span initial={{ width: 0 }} animate={{ width: `${needs}%` }} className="bg-slate-400" />
        <motion.span initial={{ width: 0 }} animate={{ width: `${wants}%` }} transition={{ delay: 0.1 }} className="bg-coin" />
        <motion.span initial={{ width: 0 }} animate={{ width: `${save}%` }} transition={{ delay: 0.2 }} className="bg-gain" />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>Needs {needs}%</span>
        <span>Wants {wants}%</span>
        <span>Save {save}%</span>
      </div>
    </div>
  );
}

export function LifeSimBoard({ state, actions, onAction, busy }: RendererProps<LifeSimState>) {
  // Number keys pick a budget plan (event choices get theirs from ChoicePanel).
  useEffect(() => {
    if (state.pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (busy || shouldIgnoreGameKey(e)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= actions.length) {
        e.preventDefault();
        onAction(actions[n - 1].type, actions[n - 1].payload);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.pending, actions, onAction, busy]);

  const goalRatio = Math.max(0, state.savings - state.loan) / state.savingsGoal;
  const chartData = [{ month: 0, savings: 0 }, ...state.history.map((h) => ({ month: h.month, savings: Math.round((h.savings - h.loan) / 100) }))];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Monthly income (virtual)</p>
          <p className="font-display text-xl font-bold">{formatINR(state.income)}</p>
          <div className="mt-2 flex gap-1" aria-label={`Month ${Math.min(state.month, state.months)} of ${state.months}`}>
            {Array.from({ length: state.months }, (_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={{ scale: i + 1 === state.month ? 1.25 : 1 }}
                className={cn('h-2 flex-1 rounded-full', i + 1 < state.month ? 'bg-brand' : i + 1 === state.month ? 'bg-brand/50' : 'bg-surface-2')}
              />
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-muted">Savings goal</p>
            <p className="text-xs font-semibold text-muted">{Math.round(Math.min(goalRatio, 1) * 100)}%</p>
          </div>
          <p className="font-display text-xl font-bold text-coin">{formatINR(state.savings)} <span className="text-sm font-medium text-muted">/ {formatINR(state.savingsGoal)}</span></p>
          <Progress value={goalRatio} className="mt-2" barClassName="from-amber-400 to-emerald-500" label="Savings goal progress" />
          {state.loan > 0 && <p className="mt-2 text-xs font-semibold text-loss">⚠ Loan: {formatINR(state.loan)} at 3%/month</p>}
        </div>
        <div className="rounded-3xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Happiness</p>
          <div className="flex items-center gap-3">
            <motion.span key={mood(state.happiness)} initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="text-3xl" aria-hidden>
              {mood(state.happiness)}
            </motion.span>
            <p className="font-display text-xl font-bold">{Math.round(state.happiness)}%</p>
          </div>
          <Progress value={state.happiness / 100} className="mt-2" barClassName={state.happiness < 35 ? 'from-red-500 to-orange-400' : 'from-pink-400 to-violet-500'} label="Happiness" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {state.pending ? (
          <motion.div
            key={`event-${state.month}-${state.pending.id}`}
            initial={{ opacity: 0, rotateX: -60, y: 30 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 140, damping: 16 }}
            style={{ transformPerspective: 900 }}
            className="rounded-3xl border-2 border-coin/40 bg-gradient-to-br from-coin/10 to-transparent p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-coin">Life happens · Month {state.month}</p>
            <div className="mt-2 flex items-start gap-4">
              <motion.span className="text-5xl" animate={{ rotate: [0, -10, 10, -6, 0] }} transition={{ duration: 0.8, delay: 0.3 }} aria-hidden>
                {state.pending.emoji}
              </motion.span>
              <div>
                <h2 className="text-2xl font-bold">{state.pending.title}</h2>
                <p className="mt-1 text-muted">{state.pending.body}</p>
              </div>
            </div>
            <ChoicePanel actions={actions} onAction={onAction} busy={busy} className="mt-5" />
          </motion.div>
        ) : actions.length ? (
          <motion.div key={`budget-${state.month}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="text-2xl font-bold">Month {state.month}: plan your budget</h2>
            <p className="mt-1 text-sm text-muted">Needs are fixed costs like rent, food and travel. Split the rest between fun and savings.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {actions.map((a, i) => {
                const key = String(a.payload?.plan);
                const style = PLAN_STYLE[key];
                return (
                  <motion.button
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={busy}
                    onClick={() => onAction(a.type, a.payload)}
                    className={cn('rounded-3xl border-2 border-border bg-surface p-5 text-left shadow-sm transition disabled:opacity-60', style?.ring, state.lastPlan === key && 'border-brand/40')}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl" aria-hidden>{style?.emoji}</span>
                      <div>
                        <p className="font-bold">{a.label}</p>
                        <p className="text-xs text-muted">{a.hint?.split(' — ')[1]}</p>
                      </div>
                      <span className="ml-auto rounded-lg bg-surface-2 px-2 py-0.5 text-xs font-bold text-muted">{i + 1}</span>
                    </div>
                    <SplitBar hint={a.hint} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {state.history.length > 0 && (
        <div className="rounded-3xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-semibold">Net savings over the year (₹, virtual)</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lifeSav" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--gain))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="rgb(var(--gain))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="rgb(var(--muted))" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={56} stroke="rgb(var(--muted))" tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Net savings']} labelFormatter={(m) => `Month ${m}`} contentStyle={{ borderRadius: 12, background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }} />
                <Area type="monotone" dataKey="savings" stroke="rgb(var(--gain))" strokeWidth={2.5} fill="url(#lifeSav)" animationDuration={700} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
