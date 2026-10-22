'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Pill tabs with a sliding active indicator. */
export function Tabs<T extends string>({ tabs, value, onChange, id, className }: { tabs: { value: T; label: string }[]; value: T; onChange: (v: T) => void; id: string; className?: string }) {
  return (
    <div role="tablist" className={cn('inline-flex flex-wrap gap-1 rounded-2xl bg-surface-2 p-1', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn('relative rounded-xl px-4 py-2 text-sm font-semibold transition-colors', value === t.value ? 'text-fg' : 'text-muted hover:text-fg')}
        >
          {value === t.value && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-xl bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
