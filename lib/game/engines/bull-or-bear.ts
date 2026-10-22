import { randomBars, type Bar } from '@/lib/content/market';
import { BaseGameEngine, clamp, type BaseState } from '../base-engine';
import { SeededRandom } from '../seeded-random';
import { GameRuleError, type Action, type EngineUser, type GameEvent, type GameResult, type GameState } from '../types';

interface Headline {
  text: string;
  sentiment: 1 | 0 | -1;
}

const COMPANIES = ['TechNova', 'Bharat Bank', 'GreenGrid Power', 'DailyNeeds FMCG', 'SwiftRail Logistics', 'MediCure Pharma', 'Kisan Agro', 'UrbanNest Realty'];

const HEADLINES: Headline[] = [
  { text: '{c} wins ₹2,000 crore export order', sentiment: 1 },
  { text: '{c} reports record quarterly profit, beats estimates', sentiment: 1 },
  { text: 'Analysts upgrade {c} to “buy” after strong demand', sentiment: 1 },
  { text: '{c} announces bonus shares and higher dividend', sentiment: 1 },
  { text: 'Government scheme set to boost {c}’s sector', sentiment: 1 },
  { text: 'Regulator fines {c} for compliance lapses', sentiment: -1 },
  { text: '{c} CEO resigns suddenly; questions over accounts', sentiment: -1 },
  { text: '{c} misses profit targets as costs surge', sentiment: -1 },
  { text: 'Factory fire halts production at {c}', sentiment: -1 },
  { text: 'Raw material prices spike, squeezing {c}’s margins', sentiment: -1 },
  { text: 'Markets await RBI policy decision on Friday', sentiment: 0 },
  { text: '{c} holds annual meeting; no major announcements', sentiment: 0 },
  { text: 'Foreign investors stay cautious ahead of global data', sentiment: 0 },
];

interface Round {
  company: string;
  headline: string;
  bars: Bar[];
}

export interface BullBearState extends BaseState {
  totalTurns: number;
  rounds: number;
  round: number;
  correct: number;
  streak: number;
  bestStreak: number;
  current: Round | null;
  /** Inputs to the next move (both readable from the headline and chart); the move itself is rolled at answer time. */
  hidden: { sentiment: number; trend: number };
  lastReveal: { call: 'BULL' | 'BEAR'; up: boolean; correct: boolean; next: Bar; bars: Bar[]; headline: string; explanation: string } | null;
}

const VISIBLE = 20;

function makeRound(rng: SeededRandom): { round: Round; hidden: BullBearState['hidden'] } {
  const company = rng.pick(COMPANIES);
  const h = rng.pick(HEADLINES);
  const trend = rng.pick([-1, 0, 1]);
  const bars = randomBars(rng, VISIBLE, rng.int(200, 3000) * 100, 0.018, trend * 0.003);
  return { round: { company, headline: h.text.replace('{c}', company), bars }, hidden: { sentiment: h.sentiment, trend } };
}

export class BullOrBearEngine extends BaseGameEngine<BullBearState> {
  readonly slug = 'bull-or-bear';

  init(config: unknown, _user: EngineUser, seed: number): BullBearState {
    const c = (config ?? {}) as { rounds?: number };
    const rounds = clamp(Math.round(c.rounds ?? 10), 1, 30);
    const rng = new SeededRandom(seed);
    const { round, hidden } = makeRound(rng);
    return {
      ...this.baseState(seed),
      rngState: rng.state,
      totalTurns: rounds,
      rounds,
      round: 0,
      correct: 0,
      streak: 0,
      bestStreak: 0,
      current: round,
      hidden,
      lastReveal: null,
    };
  }

  getAvailableActions(state: BullBearState): Action[] {
    if (!state.current) return [];
    return [
      { type: 'BULL', label: '🐂 Bull — it goes up', hint: '↑' },
      { type: 'BEAR', label: '🐻 Bear — it goes down', hint: '↓' },
    ];
  }

  isFinished(state: BullBearState): boolean {
    return state.round >= state.rounds;
  }

  protected step(state: BullBearState, action: Action, rng: SeededRandom): GameEvent[] {
    if (!state.current) throw new GameRuleError('NO_ROUND', 'No chart to call.');
    const { sentiment, trend } = state.hidden;
    // News dominates, the recent trend helps a little, and luck does the rest (~60–70% predictable).
    const pUp = clamp(0.5 + 0.22 * sentiment + 0.08 * trend, 0.15, 0.85);
    const up = rng.next() < pUp;
    const last = state.current.bars[state.current.bars.length - 1];
    const move = (0.015 + rng.next() * 0.035) * (up ? 1 : -1);
    const close = Math.max(1, Math.round(last.close * (1 + move)));
    const next: Bar = {
      date: new Date(Date.parse(last.date) + 86_400_000).toISOString().slice(0, 10),
      open: last.close,
      close,
      high: Math.round(Math.max(last.close, close) * 1.006),
      low: Math.round(Math.min(last.close, close) * 0.994),
      volume: Math.round(last.volume * 1.4),
    };
    const call = action.type as 'BULL' | 'BEAR';
    const correct = (call === 'BULL') === up;
    const events: GameEvent[] = [];
    const surprise = (sentiment > 0 && !up) || (sentiment < 0 && up);
    const explanation = surprise
      ? 'Surprise! The news pointed one way but the price went the other. Markets often “price in” news before you hear it.'
      : sentiment !== 0
        ? `The headline moved the price ${up ? 'up' : 'down'}, as news often does.`
        : 'With no real news, short-term moves are close to a coin flip.';

    if (correct) {
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const mult = 1 + 0.25 * Math.min(state.streak - 1, 4);
      const pts = Math.round(70 * mult);
      state.score = Math.min(1000, state.score + pts);
      events.push({ kind: 'SCORE', message: `${up ? '📈' : '📉'} Correct! ${state.streak > 1 ? `Streak ×${mult.toFixed(2)}` : ''}`.trim(), delta: pts });
    } else {
      state.streak = 0;
      events.push({ kind: 'CONSEQUENCE', message: `${up ? '📈 It went up' : '📉 It went down'} ${(move * 100).toFixed(1)}%. Streak reset.` });
    }
    events.push({ kind: 'TIP', message: explanation });
    if (surprise) {
      const tip = 'Even experts can’t time the market every time. Long-term investing beats guessing.';
      if (!state.learned.includes(tip)) state.learned.push(tip);
    }
    if (sentiment !== 0 && !surprise) {
      const tip = 'News about earnings, orders or scandals can move a stock sharply.';
      if (!state.learned.includes(tip)) state.learned.push(tip);
    }

    state.lastReveal = { call, up, correct, next, bars: state.current.bars, headline: state.current.headline, explanation };
    state.round += 1;
    if (state.round < state.rounds) {
      const { round, hidden } = makeRound(rng);
      state.current = round;
      state.hidden = hidden;
    } else {
      state.current = null;
    }
    return events;
  }

  publicState(state: BullBearState): GameState {
    const { hidden: _hidden, ...rest } = super.publicState(state) as BullBearState;
    return rest;
  }

  computeResult(state: BullBearState): GameResult {
    return {
      finalScore: state.score,
      performance: clamp(state.score / 750, 0, 1) || 0,
      goalReached: state.correct >= Math.ceil(state.rounds * 0.6),
      learnings: this.summarizeLearnings(state, [
        'A candlestick shows open, high, low and close for one day.',
        'News about earnings, orders or scandals can move a stock sharply.',
        'Even experts can’t time the market every time. Long-term investing beats guessing.',
      ]),
      stats: { correct: state.correct, rounds: state.rounds, bestStreak: state.bestStreak },
    };
  }
}

export const bullOrBearEngine = new BullOrBearEngine();
