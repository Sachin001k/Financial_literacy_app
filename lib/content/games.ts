import type { Difficulty, GameCategory } from '@/lib/game/types';

export interface GameDef {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  /** Emoji + gradient used for card art (no external assets needed). */
  cover: { emoji: string; from: string; to: string };
  category: GameCategory;
  section: 'Stock & Portfolio' | 'Life & Money' | 'Quick Challenges';
  difficulty: Difficulty;
  durationMin: [number, number];
  /** XP for a perfect run; actual XP scales with performance. */
  xpReward: number;
  unlockLevel: number;
  /** Lesson that unlocks the game early (optional). */
  unlockLesson?: string;
  skills: string[];
  goal: string;
  rules: string[];
  rewards: string[];
  learnOutcomes: string[];
  featured: boolean;
  isNew?: boolean;
  config: Record<string, unknown>;
}

export const GAMES: GameDef[] = [
  {
    slug: 'life-simulator',
    title: 'Life Simulator',
    tagline: 'Survive 12 months and hit your savings goal',
    description:
      'You have a monthly income and a pile of bills. Each month brings choices, surprises and temptations. Budget well, build an emergency fund and finish the year with savings in the bank.',
    cover: { emoji: '🏙️', from: '#6366f1', to: '#22c55e' },
    category: 'LIFE',
    section: 'Life & Money',
    difficulty: 'BEGINNER',
    durationMin: [10, 15],
    xpReward: 120,
    unlockLevel: 1,
    skills: ['Budgeting', 'Emergencies', 'Needs vs wants'],
    goal: 'Finish 12 months with at least ₹15,000 saved and never go broke.',
    rules: [
      'Each month you choose how to split your income across needs, wants and savings.',
      'Random life events hit some months: a phone breaks, a friend’s wedding, a bonus.',
      'If your cash drops below zero you take an expensive loan and lose points.',
      'Happiness matters too: cutting every want makes the year harder.',
    ],
    rewards: ['Up to 120 XP', 'Coins for every ₹ saved', 'Achievement: Budget Boss'],
    learnOutcomes: ['The 50/30/20 rule', 'Why an emergency fund comes first', 'Telling needs from wants'],
    featured: true,
    config: { months: 12, income: 2500000, savingsGoal: 1500000 },
  },
  {
    slug: 'investment-simulator',
    title: 'Investment Simulator',
    tagline: 'Grow ₹1,00,000 over 5 simulated years',
    description:
      'Build a portfolio from stocks, index funds, gold, bonds and fixed deposits. Markets swing, news breaks, and every year you decide whether to buy, sell or hold.',
    cover: { emoji: '📈', from: '#0ea5e9', to: '#6366f1' },
    category: 'STOCKS',
    section: 'Stock & Portfolio',
    difficulty: 'INTERMEDIATE',
    durationMin: [10, 20],
    xpReward: 150,
    unlockLevel: 2,
    unlockLesson: 'what-is-a-stock',
    skills: ['Diversification', 'Risk', 'Compounding'],
    goal: 'Beat a fixed deposit (6.5% a year) over 5 years without panic-selling.',
    rules: [
      'You start with ₹1,00,000 virtual cash.',
      'Each year: buy or sell assets, then advance the year.',
      'Market news moves prices; some assets swing much more than others.',
      'Your score rewards growth and penalises big drawdowns.',
    ],
    rewards: ['Up to 150 XP', 'Coins for every 1% return', 'Achievements: First Trade, Diversified'],
    learnOutcomes: ['Risk vs return', 'Why diversification smooths the ride', 'Compounding over years'],
    featured: true,
    config: { years: 5, startingCash: 10000000 },
  },
  {
    slug: 'money-challenges',
    title: 'Money Challenges',
    tagline: '10 real-life money puzzles, 5 minutes',
    description:
      'Quick scenario cards about discounts, EMIs, inflation, scams and UPI. Pick the smartest answer and see why.',
    cover: { emoji: '🧩', from: '#f59e0b', to: '#ef4444' },
    category: 'CHALLENGE',
    section: 'Quick Challenges',
    difficulty: 'BEGINNER',
    durationMin: [3, 5],
    xpReward: 60,
    unlockLevel: 1,
    skills: ['Discounts', 'Inflation', 'UPI safety'],
    goal: 'Answer 10 scenario cards; 7 or more right is a win.',
    rules: ['Each card has one best answer.', 'Faster streaks earn bonus points.', 'Every card explains the answer.'],
    rewards: ['Up to 60 XP', 'Coins per correct answer'],
    learnOutcomes: ['Spotting a fake discount', 'What inflation does to savings', 'Safe UPI habits'],
    featured: false,
    config: { cards: 10 },
  },
  {
    slug: 'bull-or-bear',
    title: 'Bull or Bear',
    tagline: 'Read the chart. Call the next move.',
    description:
      'See a chart snippet and a headline, then predict whether the price goes up or down next. Build a streak — and learn why nobody can time the market every time.',
    cover: { emoji: '🐂', from: '#22c55e', to: '#0ea5e9' },
    category: 'STOCKS',
    section: 'Stock & Portfolio',
    difficulty: 'BEGINNER',
    durationMin: [2, 4],
    xpReward: 50,
    unlockLevel: 1,
    skills: ['Reading charts', 'News impact', 'Market timing'],
    goal: 'Make 10 calls; streaks multiply your score.',
    rules: ['Each round shows 20 days of prices and a headline.', 'Call Bull (up) or Bear (down).', 'Correct calls in a row build a streak multiplier.'],
    rewards: ['Up to 50 XP', 'Achievement: Chart Reader'],
    learnOutcomes: ['Candlestick basics', 'How news moves prices', 'Why timing the market is hard'],
    featured: true,
    isNew: true,
    config: { rounds: 10 },
  },
  {
    slug: 'portfolio-builder',
    title: 'Portfolio Builder',
    tagline: 'Build for a persona, then fast-forward 10 years',
    description:
      'Meet a persona with a goal and a risk appetite. Split their money across asset classes, set a monthly SIP, then watch 10 years unfold.',
    cover: { emoji: '🧺', from: '#8b5cf6', to: '#ec4899' },
    category: 'STOCKS',
    section: 'Stock & Portfolio',
    difficulty: 'INTERMEDIATE',
    durationMin: [5, 8],
    xpReward: 90,
    unlockLevel: 2,
    unlockLesson: 'diversification',
    skills: ['Asset allocation', 'Rebalancing', 'SIPs'],
    goal: 'Reach the persona’s goal with a portfolio that suits their risk profile.',
    rules: [
      'Allocate 100% across equity, debt, gold and cash.',
      'Choose a monthly SIP amount the persona can afford.',
      'At year 5 you may rebalance once.',
      'Score = goal reached + risk fit + smart rebalancing.',
    ],
    rewards: ['Up to 90 XP', 'Achievement: Diversified'],
    learnOutcomes: ['Matching risk to goals', 'Power of a monthly SIP', 'When to rebalance'],
    featured: false,
    config: { years: 10 },
  },
  {
    slug: 'scam-or-legit',
    title: 'Scam or Legit',
    tagline: 'Swipe to spot fraud before it spots you',
    description:
      'Messages, offers and calls flash on screen. Swipe left for scam, right for legit. Learn the red flags that protect your money.',
    cover: { emoji: '🕵️', from: '#ef4444', to: '#8b5cf6' },
    category: 'CHALLENGE',
    section: 'Quick Challenges',
    difficulty: 'BEGINNER',
    durationMin: [2, 3],
    xpReward: 40,
    unlockLevel: 1,
    skills: ['UPI fraud', 'Phishing', 'Too-good-to-be-true'],
    goal: 'Judge 12 messages; catch every scam.',
    rules: ['Swipe left (or press ←) for scam, right (→) for legit.', 'Missing a scam costs more than doubting a real one.', 'Each card shows its red flags after you answer.'],
    rewards: ['Up to 40 XP', 'Achievement: Scam Spotter'],
    learnOutcomes: ['Never share an OTP', 'Collect requests vs pay requests on UPI', 'Guaranteed returns are a red flag'],
    featured: true,
    isNew: true,
    config: { cards: 12 },
  },
];

export const GAME_SECTIONS = [
  { key: 'featured', title: 'Featured', subtitle: 'Our most-played games right now' },
  { key: 'Stock & Portfolio', title: 'Stock & Portfolio', subtitle: 'Markets, charts and long-term investing' },
  { key: 'Life & Money', title: 'Life & Money', subtitle: 'Budgets, bills and real-life choices' },
  { key: 'Quick Challenges', title: 'Quick Challenges', subtitle: 'Five minutes or less' },
] as const;

export function getGame(slug: string): GameDef | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export function gamesInSection(key: string): GameDef[] {
  if (key === 'featured') return GAMES.filter((g) => g.featured);
  return GAMES.filter((g) => g.section === key);
}

export interface LockInfo {
  reason: string;
  requiredLevel?: number;
}

/** A game is open at its level, or earlier once its unlock lesson is completed. */
export function lockFor(game: GameDef, level: number | null, completedLessons: Set<string>): LockInfo | undefined {
  if (level === null) return undefined; // logged-out visitors see everything; Play triggers the signup gate
  if (level >= game.unlockLevel) return undefined;
  if (game.unlockLesson && completedLessons.has(game.unlockLesson)) return undefined;
  return {
    reason: game.unlockLesson
      ? `Reach level ${game.unlockLevel} or finish the “${game.unlockLesson.replace(/-/g, ' ')}” lesson`
      : `Reach level ${game.unlockLevel}`,
    requiredLevel: game.unlockLevel,
  };
}

export const ONBOARDING_MISSIONS: Record<'BEGINNER' | 'SOME_EXPERIENCE', { slug: string; config: Record<string, unknown>; title: string; blurb: string }> = {
  BEGINNER: {
    slug: 'life-simulator',
    config: { months: 3, income: 100000, savingsGoal: 30000, mission: true },
    title: 'First mission: make ₹1,000 last 3 months',
    blurb: 'You get ₹1,000 pocket money each month. Cover the basics, enjoy a little, and save ₹300 by the end.',
  },
  SOME_EXPERIENCE: {
    slug: 'investment-simulator',
    config: { years: 3, startingCash: 100000, mission: true },
    title: 'First mission: invest your first ₹1,000',
    blurb: 'Put ₹1,000 to work for 3 years. Spread it out, ride the swings, and beat the fixed deposit.',
  },
};
