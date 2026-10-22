'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { api, queryKeys } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AchievementItem {
  code: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string | null;
}

/** Unlocked badges flip on hover to show the date; locked ones are greyed. */
export function AchievementGrid() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.achievements, queryFn: () => api<{ achievements: AchievementItem[] }>('/me/achievements') });
  if (isLoading) return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-36" />)}</div>;
  const items = data?.achievements ?? [];
  const unlocked = items.filter((a) => a.unlockedAt).length;
  return (
    <div>
      <p className="mb-4 text-sm text-muted">{unlocked} of {items.length} unlocked</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((a, i) => (
          <motion.div
            key={a.code}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="group h-36 [perspective:800px]"
          >
            <div className={cn('relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]', a.unlockedAt && 'group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]')}>
              <div
                tabIndex={a.unlockedAt ? 0 : -1}
                className={cn('absolute inset-0 flex flex-col items-center justify-center rounded-3xl border p-3 text-center [backface-visibility:hidden]', a.unlockedAt ? 'border-coin/40 bg-gradient-to-br from-coin/10 to-surface' : 'border-border bg-surface-2')}
              >
                <span className={cn('text-4xl', !a.unlockedAt && 'opacity-30 grayscale')}>{a.icon}</span>
                <p className={cn('mt-2 text-sm font-bold', !a.unlockedAt && 'text-muted')}>{a.title}</p>
                {!a.unlockedAt && <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Lock className="h-3 w-3" /> {a.description}</p>}
              </div>
              {a.unlockedAt && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-violet-500 p-3 text-center text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <p className="text-sm font-semibold">{a.description}</p>
                  <p className="mt-2 text-xs opacity-80">Unlocked {new Date(a.unlockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="mt-1 text-xs font-bold">+{a.xpReward} XP</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
