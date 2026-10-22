'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, FastForward, Newspaper } from 'lucide-react';
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import type { InvestSimState } from '@/lib/game/engines/investment-simulator';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RendererProps } from './types';

const TYPE_LABEL: Record<string, string> = { STOCK: 'Stock', INDEX_FUND: 'Index fund', MUTUAL_FUND: 'Mutual fund', GOLD: 'Gold', FD: 'Fixed deposit', BOND: 'Bond' };
const TYPE_COLOR: Record<string, string> = { CASH: '#94a3b8', STOCK: '#6366f1', INDEX_FUND: '#0ea5e9', MUTUAL_FUND: '#8b5cf6', GOLD: '#f59e0b', FD: '#22c55e', BOND: '#14b8a6' };

function RiskDots({ risk }: { risk: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Risk ${risk} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn('h-1.5 w-3 rounded-full', i <= risk ? (risk >= 4 ? 'bg-loss' : risk === 3 ? 'bg-coin' : 'bg-gain') : 'bg-surface-2')} />
      ))}
    </span>
  );
}

export function InvestSimBoard({ state, actions, onAction, busy }: RendererProps<InvestSimState>) {
  const [selected, setSelected] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const canBuy = actions.some((a) => a.type === 'BUY');
  const canSell = actions.some((a) => a.type === 'SELL');
  const nextLabel = actions.find((a) => a.type === 'NEXT_YEAR')?.label ?? 'Next year';

  const value = state.portfolio.cash + state.portfolio.holdings.reduce((t, h) => t + h.qty * state.prices[h.symbol], 0);
  const change = (value - state.startValue) / state.startValue;

  const allocation = useMemo(() => {
    const parts: Record<string, number> = { CASH: state.portfolio.cash };
    for (const h of state.portfolio.holdings) {
      const t = state.assets.find((a) => a.symbol === h.symbol)?.type ?? 'STOCK';
      parts[t] = (parts[t] ?? 0) + h.qty * state.prices[h.symbol];
    }
    return Object.entries(parts).filter(([, v]) => v > 0).map(([k, v]) => ({ type: k, share: v / value }));
  }, [state, value]);

  const sel = selected ? state.assets.find((a) => a.symbol === selected) : null;
  const selPrice = selected ? state.prices[selected] : 0;
  const holding = selected ? state.portfolio.holdings.find((h) => h.symbol === selected) : undefined;
  const maxBuy = selPrice ? Math.floor(state.portfolio.cash / selPrice) : 0;

  const chartData = state.history.map((h) => ({ year: `Y${h.year}`, Portfolio: Math.round(h.value / 100), 'Fixed deposit': Math.round(h.fd / 100) }));

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {state.news && (
          <motion.div key={state.year} initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="flex items-start gap-3 rounded-3xl border border-sky-400/40 bg-sky-400/10 p-4">
            <Newspaper className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">Year {state.year} headline</p>
              <p className="font-semibold">{state.news.headline}</p>
              <p className="mt-0.5 text-sm text-muted">{state.news.lesson}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Portfolio value</p>
          <p className="font-display text-2xl font-bold">{formatINR(value)}</p>
          <p className={cn('text-sm font-semibold', change >= 0 ? 'text-gain' : 'text-loss')}>{change >= 0 ? '▲ +' : '▼ '}{(change * 100).toFixed(1)}% since start</p>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Cash to invest</p>
          <p className="font-display text-2xl font-bold text-coin">{formatINR(state.portfolio.cash)}</p>
          <p className="text-sm text-muted">Idle cash earns only 3%</p>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-4">
          <p className="mb-2 text-xs text-muted">Your mix</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
            {allocation.map((a) => (
              <motion.span key={a.type} layout initial={{ width: 0 }} animate={{ width: `${a.share * 100}%` }} style={{ background: TYPE_COLOR[a.type] }} title={`${a.type === 'CASH' ? 'Cash' : TYPE_LABEL[a.type]} ${(a.share * 100).toFixed(0)}%`} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
            {allocation.map((a) => (
              <span key={a.type} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR[a.type] }} />{a.type === 'CASH' ? 'Cash' : TYPE_LABEL[a.type]} {(a.share * 100).toFixed(0)}%</span>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-semibold">Market · Year {state.year} prices</p>
          <p className="text-xs text-muted">Tap an asset to trade</p>
        </div>
        <div className="divide-y divide-border">
          {state.assets.map((a, i) => {
            const r = state.lastReturns[a.symbol];
            const h = state.portfolio.holdings.find((x) => x.symbol === a.symbol);
            return (
              <motion.button
                key={a.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => {
                  setSelected(a.symbol === selected ? null : a.symbol);
                  setQty(1);
                }}
                className={cn('grid w-full grid-cols-[1fr_auto] items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-surface-2 sm:grid-cols-[1fr_90px_110px_90px]', selected === a.symbol && 'bg-brand-soft/60')}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{a.name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted">{TYPE_LABEL[a.type]} <RiskDots risk={a.risk} /></span>
                </span>
                <span className="hidden text-right text-sm tabular-nums sm:block">{h ? `${h.qty} held` : '—'}</span>
                <span className="text-right font-semibold tabular-nums">{formatINR(state.prices[a.symbol], { decimals: state.prices[a.symbol] < 10000 })}</span>
                <span className={cn('hidden items-center justify-end gap-0.5 text-sm font-semibold tabular-nums sm:flex', r === undefined ? 'text-muted' : r >= 0 ? 'text-gain' : 'text-loss')}>
                  {r === undefined ? '—' : <>{r >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}{r >= 0 ? '+' : ''}{(r * 100).toFixed(1)}%</>}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {sel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-3xl border-2 border-brand/40 bg-surface p-5">
              <p className="font-bold">{sel.name}</p>
              <p className="text-sm text-muted">{sel.blurb}</p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Units</span>
                  <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))} className="h-11 w-28 rounded-xl border border-border bg-surface px-3 tabular-nums outline-none focus:border-brand" />
                </label>
                <div className="flex gap-1">
                  {[0.25, 0.5, 1].map((f) => (
                    <button key={f} onClick={() => setQty(Math.max(1, Math.floor(maxBuy * f)))} className="h-11 rounded-xl bg-surface-2 px-3 text-xs font-semibold hover:bg-border" disabled={!maxBuy}>
                      {f === 1 ? 'Max' : `${f * 100}%`}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted">Cost: <strong className="text-fg">{formatINR(qty * selPrice)}</strong></p>
                <div className="ml-auto flex gap-2">
                  <Button variant="gain" disabled={!canBuy || busy || qty > maxBuy} onClick={() => onAction('BUY', { symbol: sel.symbol, qty })}>Buy</Button>
                  <Button variant="loss" disabled={!canSell || busy || !holding || qty > holding.qty} onClick={() => onAction('SELL', { symbol: sel.symbol, qty })}>Sell</Button>
                </div>
              </div>
              {holding && <p className="mt-2 text-xs text-muted">You own {holding.qty} units, bought at {formatINR(holding.avgPrice, { decimals: true })} on average.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        <Button size="lg" className="w-full" disabled={busy || !actions.some((a) => a.type === 'NEXT_YEAR')} onClick={() => onAction('NEXT_YEAR')}>
          <FastForward className="h-5 w-5" /> {nextLabel}
        </Button>
      </motion.div>

      {chartData.length > 1 && (
        <div className="rounded-3xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-semibold">Your portfolio vs a 6.5% fixed deposit (₹, virtual)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={11} stroke="rgb(var(--muted))" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={70} stroke="rgb(var(--muted))" tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} domain={['auto', 'auto']} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={{ borderRadius: 12, background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Portfolio" stroke="rgb(var(--brand))" strokeWidth={3} dot={{ r: 3 }} animationDuration={800} />
                <Line type="monotone" dataKey="Fixed deposit" stroke="rgb(var(--muted))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
