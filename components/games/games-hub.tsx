'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SearchX } from 'lucide-react';
import { useGameSections } from '@/components/landing/landing-games';
import { Button } from '@/components/ui/button';
import { DailyChallengeBanner } from './daily-challenge-banner';
import { GameCard } from './game-card';
import { DEFAULT_FILTERS, GameFilters, matchesDuration, type Filters } from './game-filters';
import { GameSection } from './game-section';

export function GamesHub() {
  const { sections } = useGameSections();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const filtering = filters.category !== 'ALL' || filters.difficulty !== 'ALL' || filters.duration !== 'ALL';

  const filtered = useMemo(() => {
    const all = new Map(sections.flatMap((s) => s.games).map((g) => [g.slug, g]));
    return [...all.values()].filter(
      (g) =>
        (filters.category === 'ALL' || g.category === filters.category) &&
        (filters.difficulty === 'ALL' || g.difficulty === filters.difficulty) &&
        matchesDuration(filters.duration, g.durationMin),
    );
  }, [sections, filters]);

  return (
    <div className="container-page py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Games</h1>
        <p className="mt-2 text-muted">Every game has a goal, real choices, consequences — and a “What you learned” card at the end.</p>
      </motion.div>
      <DailyChallengeBanner />
      <div className="mt-8">
        <GameFilters value={filters} onChange={setFilters} />
      </div>
      <AnimatePresence mode="wait">
        {filtering ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8">
            <p className="mb-4 text-sm text-muted">{filtered.length} game{filtered.length === 1 ? '' : 's'} found</p>
            {filtered.length ? (
              <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filtered.map((g) => (
                    <motion.div key={g.slug} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
                      <GameCard game={g} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border py-16 text-center">
                <SearchX className="h-10 w-10 text-muted" />
                <p className="font-semibold">No games match those filters</p>
                <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear filters</Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="sections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4">
            {sections.map((s) => (
              <GameSection key={s.key} title={s.title} subtitle={s.subtitle} games={s.games} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
