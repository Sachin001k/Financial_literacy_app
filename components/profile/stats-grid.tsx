'use client';

import { BookOpen, Flame, Gamepad2, Star, Wallet, Zap } from 'lucide-react';
import { CountUp } from '@/components/motion/count-up';
import { StaggerItem, StaggerList } from '@/components/motion/stagger';
import { formatINR } from '@/lib/format';
import type { MeSummary } from '@/lib/server/me';

export function StatsGrid({ me, gamesFinished, lessonsDone }: { me: MeSummary; gamesFinished: number; lessonsDone: number }) {
  const stats = [
    { icon: Star, label: 'Level', value: me.progress.level, tone: 'text-brand bg-brand-soft' },
    { icon: Zap, label: 'Total XP', value: me.progress.totalXp, tone: 'text-coin bg-coin/15' },
    { icon: Flame, label: `Streak (best ${me.progress.longestStreak})`, value: me.progress.currentStreak, tone: 'text-orange-500 bg-orange-500/15' },
    { icon: Gamepad2, label: 'Games finished', value: gamesFinished, tone: 'text-violet-500 bg-violet-500/15' },
    { icon: BookOpen, label: 'Lessons done', value: lessonsDone, tone: 'text-gain bg-gain/15' },
    { icon: Wallet, label: 'Wallet', value: me.wallet.balance, tone: 'text-coin bg-coin/15', money: true },
  ];
  return (
    <StaggerList className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <StaggerItem key={s.label} className="rounded-3xl border border-border bg-surface p-4">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${s.tone}`}><s.icon className="h-5 w-5" /></span>
          <p className="mt-3 text-2xl font-extrabold tabular-nums">
            <CountUp value={s.value} format={s.money ? (n) => formatINR(n) : undefined} />
          </p>
          <p className="text-xs text-muted">{s.label}</p>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
