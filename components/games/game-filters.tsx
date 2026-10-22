'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Filters {
  difficulty: 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: 'ALL' | 'QUICK' | 'MEDIUM' | 'LONG';
  category: 'ALL' | 'STOCKS' | 'LIFE' | 'CHALLENGE';
}

export const DEFAULT_FILTERS: Filters = { difficulty: 'ALL', duration: 'ALL', category: 'ALL' };

const GROUPS = [
  { key: 'category', label: 'Topic', options: [['ALL', 'All'], ['STOCKS', '📈 Stocks'], ['LIFE', '🏙️ Life & money'], ['CHALLENGE', '🧩 Challenges']] },
  { key: 'difficulty', label: 'Difficulty', options: [['ALL', 'Any'], ['BEGINNER', 'Beginner'], ['INTERMEDIATE', 'Intermediate'], ['ADVANCED', 'Advanced']] },
  { key: 'duration', label: 'Length', options: [['ALL', 'Any'], ['QUICK', '≤ 5 min'], ['MEDIUM', '5–10 min'], ['LONG', '10+ min']] },
] as const;

export function matchesDuration(d: Filters['duration'], [, max]: [number, number]) {
  if (d === 'QUICK') return max <= 5;
  if (d === 'MEDIUM') return max > 5 && max <= 10;
  if (d === 'LONG') return max > 10;
  return true;
}

export function GameFilters({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-sm md:flex-row md:flex-wrap md:items-center md:gap-6">
      {GROUPS.map((g) => (
        <div key={g.key} className="flex flex-wrap items-center gap-1.5" role="group" aria-label={g.label}>
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-muted">{g.label}</span>
          {g.options.map(([v, label]) => {
            const active = value[g.key] === v;
            return (
              <button
                key={v}
                aria-pressed={active}
                onClick={() => onChange({ ...value, [g.key]: v })}
                className={cn('relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors', active ? 'text-white' : 'text-muted hover:text-fg')}
              >
                {active && <motion.span layoutId={`filter-${g.key}`} className="absolute inset-0 rounded-full bg-brand" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
