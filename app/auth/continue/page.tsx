'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api, gameApi } from '@/lib/api';
import { peekIntent, takeIntent } from '@/lib/intent';
import type { MeSummary } from '@/lib/server/me';

/** Same-origin relative paths only; anything else (//evil.com, /\\evil.com, absolute URLs) falls back to /home. */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/home';
  try {
    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin) return '/home';
    const path = `${url.pathname}${url.search}${url.hash}`;
    return ['/login', '/signup', '/'].includes(url.pathname) ? '/home' : path;
  } catch {
    return '/home';
  }
}

/** After signup/login: new users go through /welcome; otherwise resume the stored play intent or `next`. */
function Continue() {
  const router = useRouter();
  const params = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const next = safeNext(params.get('next'));
      try {
        const me = await api<MeSummary>('/me');
        if (!me.onboarded) return router.replace('/welcome');
        const intent = peekIntent();
        if (intent?.intent === 'PLAY') {
          takeIntent();
          try {
            const s = await gameApi.start(intent.slug, { daily: intent.daily });
            return router.replace(`/play/${s.sessionId}`);
          } catch {
            // e.g. the game is locked for this player: show its page, which explains why
            return router.replace(`/games/${encodeURIComponent(intent.slug)}`);
          }
        }
        router.replace(next);
      } catch {
        router.replace('/home');
      }
    })();
  }, [params, router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
      <motion.div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand to-emerald-500" animate={{ rotate: [0, 90, 180, 270, 360], borderRadius: ['30%', '50%', '30%'] }} transition={{ duration: 1.6, repeat: Infinity }} />
      <p className="text-muted">Getting your game ready…</p>
    </div>
  );
}

export default function ContinuePage() {
  return (
    <Suspense>
      <Continue />
    </Suspense>
  );
}
