'use client';

export type Intent = { intent: 'PLAY'; slug: string; daily?: boolean };

const KEY = 'finplay:intent';
/** Long enough to sign up and confirm an email; a stale intent shouldn't hijack a later login. */
const MAX_AGE_MS = 30 * 60 * 1000;

export function saveIntent(intent: Intent) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...intent, savedAt: Date.now() }));
  } catch {}
}

export function clearIntent() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

export function takeIntent(): Intent | null {
  const intent = peekIntent();
  clearIntent();
  return intent;
}

export function peekIntent(): Intent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const { savedAt, ...intent } = JSON.parse(raw) as Intent & { savedAt?: number };
    if (!savedAt || Date.now() - savedAt > MAX_AGE_MS) {
      clearIntent();
      return null;
    }
    return intent;
  } catch {
    return null;
  }
}
