'use client';

import { useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { saveIntent, type Intent } from '@/lib/intent';

/** Runs `action` when signed in; otherwise stores the intent and opens the signup gate. */
export function useRequireAuth() {
  const { user, openGate } = useAuth();
  return useCallback(
    (action: () => void, intent?: Intent, reason?: string) => {
      if (user) return action();
      if (intent) saveIntent(intent);
      openGate('signup', reason);
    },
    [user, openGate],
  );
}
