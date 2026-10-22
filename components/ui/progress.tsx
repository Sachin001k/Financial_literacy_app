'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Spring-filled bar used for XP, game progress and quiz progress. */
export function Progress({ value, className, barClassName, label }: { value: number; className?: string; barClassName?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-surface-2', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <motion.div
        className={cn('relative h-full rounded-full bg-gradient-to-r from-brand to-violet-400', barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 70, damping: 18 }}
      >
        <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)] bg-[length:200%_100%]" />
      </motion.div>
    </div>
  );
}
