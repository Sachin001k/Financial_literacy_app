'use client';

import type { ReactNode } from 'react';
import { BarChart3, History, Settings, Trophy } from 'lucide-react';
import { useProgress } from '@/components/learn/use-lesson-progress';
import { FadeIn } from '@/components/motion/fade-in';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { AchievementGrid } from './achievement-grid';
import { AssessmentChart } from './assessment-chart';
import { HistoryTabs } from './history-tabs';
import { ProfileHeader } from './profile-header';
import { SettingsPanel } from './settings-panel';
import { StatsGrid } from './stats-grid';

function Section({ icon, title, children, id }: { icon: ReactNode; title: string; children: ReactNode; id?: string }) {
  return (
    <FadeIn>
      <section id={id} className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">{icon}{title}</h2>
        {children}
      </section>
    </FadeIn>
  );
}

export function ProfilePage() {
  const { me, loading, refreshMe } = useAuth();
  const { data: progress } = useProgress();

  if (!loading && !me) {
    return (
      <div className="container-page py-20 text-center" role="alert">
        <p className="text-4xl" aria-hidden>😕</p>
        <h1 className="mt-3 text-2xl font-bold">We couldn’t load your profile</h1>
        <p className="mt-1 text-muted">Check your connection and try again.</p>
        <Button className="mt-6" onClick={() => void refreshMe()}>Try again</Button>
      </div>
    );
  }

  if (loading || !me) {
    return (
      <div className="container-page space-y-6 py-8" aria-busy="true">
        <div className="skeleton h-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
        <div className="skeleton h-72" />
      </div>
    );
  }

  // Distinct games finished (history rows can repeat a game)
  const gamesFinished = new Set(progress?.games.map((g) => g.game_slug) ?? []).size;
  const lessonsDone = progress?.lessons.filter((l) => l.status === 'COMPLETED').length ?? 0;

  return (
    <div className="container-page space-y-6 py-8">
      <ProfileHeader key={me.avatarUrl ?? 'none'} me={me} />
      <StatsGrid me={me} gamesFinished={gamesFinished} lessonsDone={lessonsDone} />
      <Section icon={<Trophy className="h-5 w-5 text-coin" />} title="Achievements"><AchievementGrid /></Section>
      <Section icon={<BarChart3 className="h-5 w-5 text-brand" />} title="Knowledge over time"><AssessmentChart /></Section>
      <Section icon={<History className="h-5 w-5 text-violet-500" />} title="History"><HistoryTabs /></Section>
      <Section icon={<Settings className="h-5 w-5 text-muted" />} title="Settings" id="settings"><SettingsPanel me={me} /></Section>
    </div>
  );
}
