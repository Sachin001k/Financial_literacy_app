'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GameCardData } from '@/lib/server/catalogue';
import { GameCard } from './game-card';

/** Section header + horizontally draggable carousel; cards stagger in on view. */
export function GameSection({ title, subtitle, games }: { title: string; subtitle?: string; games: GameCardData[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!games.length) return null;
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <section className="py-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="text-2xl font-bold">
            {title}
          </motion.h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => scroll(-1)} className="rounded-xl border border-border bg-surface p-2 hover:border-brand/50" aria-label="Scroll left"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => scroll(1)} className="rounded-xl border border-border bg-surface p-2 hover:border-brand/50" aria-label="Scroll right"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
      <div ref={ref} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {games.map((g, i) => (
          <motion.div
            key={g.slug}
            className="w-[280px] shrink-0 snap-start sm:w-[300px]"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ type: 'spring', stiffness: 110, damping: 16, delay: i * 0.08 }}
          >
            <GameCard game={g} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
