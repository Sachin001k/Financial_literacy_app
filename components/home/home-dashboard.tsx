'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { GameCard } from '@/components/games/game-card';
import { StaggerItem, StaggerList } from '@/components/motion/stagger';
import { FadeIn } from '@/components/motion/fade-in';
import { api, queryKeys } from '@/lib/api';
import type { GameCardData } from '@/lib/server/catalogue';
import type { HomeData } from './types';
import { ContinueGameCard, ContinueLessonCard, DailyChallengeCard, LevelProgress, RecentAchievements, WalletCard, WelcomeBanner } from './widgets';

function Skeleton() {
  return (
    <div className="container-page space-y-6 py-8" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-40" />
      <div className="grid gap-5 md:grid-cols-2"><div className="skeleton h-28" /><div className="skeleton h-28" /></div>
      <div className="grid gap-5 md:grid-cols-3"><div className="skeleton h-44" /><div className="skeleton h-44" /><div className="skeleton h-44" /></div>
    </div>
  );
}

export function HomeDashboard() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({ queryKey: queryKeys.home, queryFn: () => api<HomeData>('/home') });
  const { data: games } = useQuery({ queryKey: queryKeys.games, queryFn: () => api<{ games: GameCardData[] }>('/games') });

  useEffect(() => {
    if (data && !data.me.onboarded) router.replace('/welcome');
  }, [data, router]);

  if (isLoading || !data) {
    if (error) return <p className="container-page py-20 text-center text-muted">Could not load your dashboard: {(error as Error).message}</p>;
    return <Skeleton />;
  }

  const recommended = (games?.games ?? []).filter((g) => !g.locked).slice(0, 3);

  return (
    <div className="container-page space-y-6 py-8">
      <FadeIn y={16}><WelcomeBanner me={data.me} /></FadeIn>

      {(data.continueGame || data.continueLesson) && (
        <StaggerList className="grid gap-5 md:grid-cols-2">
          {data.continueGame && <StaggerItem><ContinueGameCard game={data.continueGame} /></StaggerItem>}
          {data.continueLesson && <StaggerItem><ContinueLessonCard lesson={data.continueLesson} /></StaggerItem>}
        </StaggerList>
      )}

      <StaggerList className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StaggerItem className="lg:col-span-2"><DailyChallengeCard daily={data.daily} streak={data.me.progress.currentStreak} /></StaggerItem>
        <StaggerItem><LevelProgress progress={data.me.progress} /></StaggerItem>
        <StaggerItem><WalletCard balance={data.me.wallet.balance} /></StaggerItem>
      </StaggerList>

      <FadeIn><RecentAchievements items={data.recentAchievements} /></FadeIn>

      {recommended.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Recommended for you</h2>
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((g) => (
              <StaggerItem key={g.slug}><GameCard game={g} /></StaggerItem>
            ))}
          </StaggerList>
        </section>
      )}
    </div>
  );
}
