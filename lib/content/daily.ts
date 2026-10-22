import { hashString } from '@/lib/game/seeded-random';
import { todayIST } from '@/lib/format';
import { getGame } from './games';

const ROTATION = ['money-challenges', 'bull-or-bear', 'scam-or-legit'] as const;

export interface DailyChallenge {
  date: string;
  gameSlug: string;
  title: string;
  blurb: string;
  config: Record<string, unknown>;
  xpReward: number;
  endsAt: string;
}

/** Deterministic per IST date, so every player gets the same challenge and seed. */
export function dailyChallengeFor(date = todayIST()): DailyChallenge {
  const h = hashString(`daily:${date}`);
  const gameSlug = ROTATION[h % ROTATION.length];
  const game = getGame(gameSlug)!;
  const end = new Date(`${date}T23:59:59+05:30`);
  return {
    date,
    gameSlug,
    title: `Daily: ${game.title}`,
    blurb: `Everyone gets the same ${game.title} round today. Finish it for 50 XP plus your streak bonus.`,
    config: { ...game.config, daily: true },
    xpReward: 50,
    endsAt: end.toISOString(),
  };
}
