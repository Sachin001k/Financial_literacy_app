import type { MeSummary } from '@/lib/server/me';

export interface HomeData {
  me: MeSummary;
  continueGame: { sessionId: string; slug: string; title: string; cover: { emoji: string; from: string; to: string }; progress: number } | null;
  continueLesson: { slug: string; category: string; title: string; summary: string; readMinutes: number } | null;
  daily: { date: string; gameSlug: string; title: string; blurb: string; xpReward: number; endsAt: string; completed: boolean };
  recentAchievements: { code: string; title: string; icon: string; unlockedAt: string }[];
  lessonsCompleted: number;
}
