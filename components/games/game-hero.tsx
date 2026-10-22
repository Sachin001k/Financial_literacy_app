'use client';

import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { GameCardData } from '@/lib/server/catalogue';

export function GameHero({ game }: { game: GameCardData }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl sm:p-12" style={{ background: `linear-gradient(135deg, ${game.cover.from}, ${game.cover.to})` }}>
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:22px_22px]" />
      <motion.span
        aria-hidden
        className="absolute -bottom-6 right-4 text-[8rem] drop-shadow-2xl sm:right-12 sm:text-[11rem]"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0, y: [0, -12, 0] }}
        transition={{ scale: { type: 'spring', stiffness: 120, damping: 12 }, rotate: { type: 'spring' }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
      >
        {game.cover.emoji}
      </motion.span>
      <div className="relative max-w-xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2">
          <Badge className="bg-white/20 text-white">{game.section}</Badge>
          <Badge className="bg-white/20 text-white">{game.difficulty.toLowerCase()}</Badge>
          {game.isNew && <Badge className="bg-white text-amber-600">New</Badge>}
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-4 text-4xl font-extrabold sm:text-5xl">
          {game.title}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-3 text-lg text-white/90">
          {game.description}
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }} className="mt-5 flex gap-5 text-sm font-semibold">
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {game.durationMin[0]}–{game.durationMin[1]} min</span>
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> Up to {game.xpReward} XP</span>
        </motion.div>
      </div>
    </section>
  );
}
