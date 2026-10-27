'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { GameSection } from '@/components/games/game-section';
import { useAuth } from '@/components/providers/auth-provider';
import { api, queryKeys } from '@/lib/api';
import { publicSections } from '@/lib/content/public-catalogue';
import type { GameCardData } from '@/lib/server/catalogue';

type Sections = { key: string; title: string; subtitle: string; games: GameCardData[] }[];

/** Logged-out: static catalogue. Logged-in: per-user locks, progress and best scores. */
export function useGameSections() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: [...queryKeys.games, user?.id],
    queryFn: () => api<{ games: GameCardData[]; sections: Sections }>('/games'),
    enabled: Boolean(user),
  });
  // On error, fall back to public data rather than "checking" forever; the server still enforces locks.
  const loading = Boolean(user) && !q.data && !q.isError;
  if (user && q.data) return { sections: q.data.sections, games: q.data.games, loading: false };
  const sections = publicSections() as Sections;
  if (!loading) return { sections, games: undefined, loading };
  // Signed-in data not here yet: hold Play until we know the player's locks (public data shows everything open).
  return {
    sections: sections.map((s) => ({ ...s, games: s.games.map((g) => ({ ...g, locked: { reason: 'Checking your progress…' } })) })),
    games: undefined,
    loading,
  };
}

export function LandingGames() {
  const { sections } = useGameSections();
  return (
    <section className="container-page py-12" aria-labelledby="games-title">
      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Games</p>
          <h2 id="games-title" className="mt-1 text-3xl font-extrabold sm:text-4xl">Pick a game, any game</h2>
        </div>
        <Link href="/games" className="hidden items-center gap-1 text-sm font-semibold text-brand hover:underline sm:flex">
          All games <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {sections.map((s) => (
        <GameSection key={s.key} title={s.title} subtitle={s.subtitle} games={s.games} />
      ))}
    </section>
  );
}
