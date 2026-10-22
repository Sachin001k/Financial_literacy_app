'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { api, queryKeys } from '@/lib/api';

export interface ProgressResponse {
  xpHistory: { amount: number; source: string; ref_id: string | null; created_at: string }[];
  games: { session_id: string; game_slug: string; title: string; final_score: number; xp_earned: number; coins_earned: number; created_at: string }[];
  lessons: { lesson_slug: string; status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; quiz_score: number | null; completed_at: string | null; title: string; category?: string }[];
}

/** Signed-in player's progress (shared by learn pages and profile). */
export function useProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.progress,
    queryFn: () => api<ProgressResponse>('/me/progress'),
    enabled: Boolean(user),
    staleTime: 15_000,
  });
}

export function useLessonStatus() {
  const { data } = useProgress();
  const map = new Map<string, { status: string; quizScore: number | null }>();
  for (const l of data?.lessons ?? []) map.set(l.lesson_slug, { status: l.status, quizScore: l.quiz_score });
  return map;
}
