'use client';

export type Intent = { intent: 'PLAY'; slug: string; daily?: boolean };

const KEY = 'finplay:intent';

export function saveIntent(intent: Intent) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(intent));
  } catch {}
}

export function takeIntent(): Intent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return raw ? (JSON.parse(raw) as Intent) : null;
  } catch {
    return null;
  }
}

export function peekIntent(): Intent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Intent) : null;
  } catch {
    return null;
  }
}
