'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Action } from '@/lib/game/types';
import { cn } from '@/lib/utils';
import { shouldIgnoreGameKey } from './keyboard';

/** Generic list of choices; number keys 1–9 pick an option. */
export function ChoicePanel({ actions, onAction, busy, className }: { actions: Action[]; onAction: (type: string, payload?: Record<string, unknown>) => void; busy: boolean; className?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy || shouldIgnoreGameKey(e)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= actions.length) {
        e.preventDefault();
        const a = actions[n - 1];
        onAction(a.type, a.payload);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, onAction, busy]);

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      {actions.map((a, i) => (
        <motion.button
          key={`${a.type}-${JSON.stringify(a.payload ?? {})}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          disabled={busy}
          onClick={() => onAction(a.type, a.payload)}
          className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:border-brand/60 hover:shadow-md disabled:opacity-60"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-muted group-hover:bg-brand group-hover:text-white">{i + 1}</span>
          <span>
            <span className="block font-semibold">{a.label ?? a.type}</span>
            {a.hint && <span className="mt-0.5 block text-sm text-muted">{a.hint}</span>}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
