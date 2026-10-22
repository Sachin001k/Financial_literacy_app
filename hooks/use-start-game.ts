'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/providers/toaster';
import { useSound } from '@/components/providers/sound-provider';
import { gameApi } from '@/lib/api';
import { useRequireAuth } from './use-require-auth';

/** Play button behaviour: gate → start/resume session → /play/[id]. */
export function useStartGame() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const { play } = useSound();
  const [pending, setPending] = useState<string | null>(null);
  const inFlight = useRef(false);

  const start = useCallback(
    async (slug: string, opts: { daily?: boolean; fresh?: boolean } = {}) => {
      // Ignore double-clicks while a session is being created.
      if (inFlight.current) return;
      inFlight.current = true;
      setPending(slug);
      try {
        const s = await gameApi.start(slug, opts);
        play('whoosh');
        router.push(`/play/${s.sessionId}`);
      } catch (e) {
        toast.error('Could not start the game', (e as Error).message);
        setPending(null);
        inFlight.current = false;
      }
    },
    [router, play],
  );

  const playGame = useCallback(
    (slug: string, opts: { daily?: boolean; fresh?: boolean } = {}) =>
      requireAuth(() => void start(slug, opts), { intent: 'PLAY', slug, daily: opts.daily }, 'Create a free account to play and save your progress.'),
    [requireAuth, start],
  );

  return { playGame, start, pending };
}
