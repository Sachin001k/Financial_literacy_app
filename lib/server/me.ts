import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { levelProgress } from '@/lib/progress/level-curve';

export interface MeSummary {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  ageBand: string;
  familiarity: 'BEGINNER' | 'SOME_EXPERIENCE';
  onboarded: boolean;
  /** False for OAuth signups until onboarding asks their age group. */
  ageConfirmed: boolean;
  tutorialDone: boolean;
  createdAt: string;
  settings: { soundOn: boolean; musicOn: boolean; reducedMotion: boolean; highContrast: boolean; language: string; theme: string };
  progress: { totalXp: number; level: number; currentStreak: number; longestStreak: number; levelFloor: number; levelCeil: number; ratio: number };
  wallet: { balance: number };
}

export async function getMeSummary(userId: string, email: string | null): Promise<MeSummary> {
  const db = getSupabaseAdmin();
  const [{ data: p }, { data: s }, { data: pr }, { data: w }] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).single(),
    db.from('user_settings').select('*').eq('user_id', userId).single(),
    db.from('player_progress').select('*').eq('user_id', userId).single(),
    db.from('wallets').select('balance').eq('user_id', userId).single(),
  ]);
  const xp = pr?.total_xp ?? 0;
  const lp = levelProgress(xp);
  return {
    id: userId,
    email,
    displayName: p?.display_name ?? 'Player',
    avatarUrl: p?.avatar_url ?? null,
    ageBand: p?.age_band ?? 'ADULT_18_24',
    familiarity: p?.familiarity ?? 'BEGINNER',
    onboarded: Boolean(p?.onboarded_at),
    ageConfirmed: Boolean(p?.age_confirmed),
    tutorialDone: Boolean(p?.tutorial_done),
    createdAt: p?.created_at ?? new Date().toISOString(),
    settings: {
      soundOn: s?.sound_on ?? true,
      musicOn: s?.music_on ?? true,
      reducedMotion: s?.reduced_motion ?? false,
      highContrast: s?.high_contrast ?? false,
      language: s?.language ?? 'en',
      theme: s?.theme ?? 'system',
    },
    progress: {
      totalXp: xp,
      level: lp.level,
      currentStreak: pr?.current_streak ?? 0,
      longestStreak: pr?.longest_streak ?? 0,
      levelFloor: lp.floor,
      levelCeil: lp.ceil,
      ratio: lp.ratio,
    },
    wallet: { balance: Number(w?.balance ?? 0) },
  };
}
