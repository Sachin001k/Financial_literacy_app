'use client';

import { motion } from 'framer-motion';
import { CountUp } from '@/components/motion/count-up';
import { formatINR } from '@/lib/format';

export function XPChip({ level, xp, ratio }: { level: number; xp: number; ratio: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold" title={`${xp} XP`}>
      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-[11px] text-white">{level}</span>
      <div className="hidden w-16 sm:block">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${ratio * 100}%` }} transition={{ type: 'spring', stiffness: 60 }} />
        </div>
      </div>
      <CountUp value={xp} className="tabular-nums" format={(n) => `${Math.round(n)} XP`} />
    </div>
  );
}

export function WalletChip({ balance }: { balance: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-coin/40 bg-coin/10 px-2.5 py-1 text-xs font-semibold text-coin" title="Virtual wallet">
      <motion.span animate={{ rotateY: [0, 360] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4 }}>🪙</motion.span>
      <CountUp value={balance} className="tabular-nums" format={(n) => formatINR(n)} />
    </div>
  );
}
