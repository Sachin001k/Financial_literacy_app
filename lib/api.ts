'use client';

import type { ActResponse, FinishedSummary, SessionDTO } from '@/lib/game/types';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Thin fetch wrapper for /api/v1. Auth rides on Supabase cookies. */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api/v1${path}`, {
    ...rest,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: { code: string; message: string } }).error;
    throw new ApiClientError(res.status, err?.code ?? 'HTTP_ERROR', err?.message ?? res.statusText);
  }
  return data as T;
}

export const gameApi = {
  start: (slug: string, body: { daily?: boolean; fresh?: boolean } = {}) =>
    api<SessionDTO>(`/games/${slug}/sessions`, { method: 'POST', json: body }),
  get: (id: string) => api<SessionDTO>(`/game-sessions/${id}`),
  act: (id: string, body: { turn: number; type: string; payload?: Record<string, unknown> }) =>
    api<ActResponse>(`/game-sessions/${id}/actions`, { method: 'POST', json: body }),
  finish: (id: string) => api<FinishedSummary>(`/game-sessions/${id}/finish`, { method: 'POST' }),
  abandon: (id: string) => api<{ status: string }>(`/game-sessions/${id}/abandon`, { method: 'POST' }),
  pause: (id: string) => api<{ status: string }>(`/game-sessions/${id}/pause`, { method: 'POST' }),
};

export const queryKeys = {
  me: ['me'] as const,
  home: ['home'] as const,
  games: ['games'] as const,
  game: (slug: string) => ['game', slug] as const,
  session: (id: string) => ['session', id] as const,
  progress: ['me', 'progress'] as const,
  achievements: ['me', 'achievements'] as const,
  assessments: ['me', 'assessments'] as const,
  leaderboard: (board: string) => ['leaderboard', board] as const,
  daily: ['daily'] as const,
  lesson: (slug: string) => ['lesson', slug] as const,
};
