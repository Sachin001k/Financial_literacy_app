import { formatINR } from '@/lib/format';

export interface HudStat {
  label: string;
  value: string;
  tone?: 'gain' | 'loss' | 'coin' | 'brand';
}

/** Per-game HUD numbers: progress, money and streaks read from engine state. */
export function hudStats(slug: string, s: any): { progress: string; stats: HudStat[] } {
  switch (slug) {
    case 'life-simulator':
      return {
        progress: `Month ${Math.min(s.month, s.months)}/${s.months}`,
        stats: [
          { label: 'Savings', value: formatINR(s.savings), tone: 'coin' },
          ...(s.loan > 0 ? [{ label: 'Loan', value: formatINR(-s.loan), tone: 'loss' as const }] : []),
          { label: 'Happiness', value: `${Math.round(s.happiness)}%`, tone: s.happiness < 35 ? 'loss' : 'gain' },
        ],
      };
    case 'investment-simulator': {
      const value = s.portfolio.cash + s.portfolio.holdings.reduce((t: number, h: any) => t + h.qty * (s.prices[h.symbol] ?? 0), 0);
      const change = (value - s.startValue) / s.startValue;
      return {
        progress: `Year ${s.year}/${s.years}`,
        stats: [
          { label: 'Portfolio', value: formatINR(value), tone: change >= 0 ? 'gain' : 'loss' },
          { label: 'Cash', value: formatINR(s.portfolio.cash), tone: 'coin' },
        ],
      };
    }
    case 'money-challenges':
      return { progress: `Card ${Math.min(s.index + 1, s.deck.length)}/${s.deck.length}`, stats: [{ label: 'Correct', value: String(s.correct), tone: 'gain' }, { label: 'Streak', value: `🔥 ${s.streak}`, tone: 'coin' }] };
    case 'bull-or-bear':
      return { progress: `Round ${Math.min(s.round + 1, s.rounds)}/${s.rounds}`, stats: [{ label: 'Correct', value: String(s.correct), tone: 'gain' }, { label: 'Streak', value: `🔥 ${s.streak}`, tone: 'coin' }] };
    case 'portfolio-builder':
      return { progress: s.phase === 'ALLOCATE' ? 'Step 1/2 · Build' : s.phase === 'REVIEW' ? `Step 2/2 · Year ${s.midYear ?? 5}` : `Year ${s.years ?? 10}`, stats: [{ label: 'Persona', value: `${s.persona.emoji} ${s.persona.name}`, tone: 'brand' }] };
    case 'scam-or-legit':
      return { progress: `Message ${Math.min(s.index + 1, s.deck.length)}/${s.deck.length}`, stats: [{ label: 'Caught', value: String(s.correct), tone: 'gain' }, { label: 'Missed scams', value: String(s.scamsMissed), tone: s.scamsMissed ? 'loss' : undefined }] };
    default:
      return { progress: `Turn ${s.turn}`, stats: [] };
  }
}
