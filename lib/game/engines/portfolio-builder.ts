import { BaseGameEngine, clamp, type BaseState } from '../base-engine';
import { SeededRandom } from '../seeded-random';
import { GameRuleError, type Action, type EngineUser, type GameEvent, type GameResult } from '../types';

type AssetClass = 'equity' | 'debt' | 'gold' | 'cash';
type Allocation = Record<AssetClass, number>;
type RiskProfile = 'Aggressive' | 'Moderate' | 'Conservative';

const CLASSES: AssetClass[] = ['equity', 'debt', 'gold', 'cash'];

const CLASS_MODEL: Record<AssetClass, { mu: number; sigma: number }> = {
  equity: { mu: 0.12, sigma: 0.18 },
  debt: { mu: 0.07, sigma: 0.04 },
  gold: { mu: 0.08, sigma: 0.13 },
  cash: { mu: 0.035, sigma: 0 },
};

interface Persona {
  id: string;
  name: string;
  emoji: string;
  age: number;
  story: string;
  goalLabel: string;
  goal: number; // paise
  lumpSum: number; // paise
  monthlyBudget: number; // paise, max affordable SIP
  risk: RiskProfile;
  /** Healthy equity % band for this profile, and minimum cash %. */
  equityBand: [number, number];
  minCash: number;
}

const PERSONAS: Persona[] = [
  { id: 'aarav', name: 'Aarav', emoji: '👨‍💻', age: 24, story: 'Just started his first job in Bengaluru. No dependants, long runway, loves tech.', goalLabel: 'House down payment in 10 years', goal: 150000000, lumpSum: 5000000, monthlyBudget: 1000000, risk: 'Aggressive', equityBand: [60, 90], minCash: 0 },
  { id: 'meera', name: 'Meera', emoji: '👩‍🏫', age: 35, story: 'Teacher in Pune with a 6-year-old daughter. Wants growth but can’t afford a disaster.', goalLabel: 'Daughter’s college fund in 10 years', goal: 250000000, lumpSum: 10000000, monthlyBudget: 1500000, risk: 'Moderate', equityBand: [40, 70], minCash: 0 },
  { id: 'iyer', name: 'Mr. Iyer', emoji: '👴', age: 50, story: 'Bank officer retiring in 10 years. Sleeps badly when markets fall.', goalLabel: 'Retirement top-up in 10 years', goal: 120000000, lumpSum: 20000000, monthlyBudget: 600000, risk: 'Conservative', equityBand: [10, 40], minCash: 0 },
  { id: 'sana', name: 'Sana', emoji: '🎨', age: 28, story: 'Freelance illustrator in Delhi. Income swings month to month, so she needs a cash cushion.', goalLabel: 'Studio of her own in 10 years', goal: 80000000, lumpSum: 2000000, monthlyBudget: 500000, risk: 'Moderate', equityBand: [35, 65], minCash: 10 },
];

export interface PortfolioBuilderState extends BaseState {
  totalTurns: number;
  phase: 'ALLOCATE' | 'REVIEW' | 'DONE';
  persona: Omit<Persona, 'equityBand' | 'minCash'> & { equityBand: [number, number]; minCash: number };
  allocation: Allocation | null;
  sip: number;
  holdings: Allocation; // paise per class
  invested: number;
  year: number;
  /** Horizon (config.years, default 10) and the rebalance checkpoint at its midpoint. */
  years: number;
  midYear: number;
  history: { year: number; value: number; invested: number }[];
  driftAtReview: Allocation | null;
  rebalanced: boolean | null;
  rebalanceScore: number;
  riskFit: number;
  sipScore: number;
}

const sum = (a: Allocation) => CLASSES.reduce((s, k) => s + a[k], 0);

export class PortfolioBuilderEngine extends BaseGameEngine<PortfolioBuilderState> {
  readonly slug = 'portfolio-builder';

  init(config: unknown, _user: EngineUser, seed: number): PortfolioBuilderState {
    const c = (config ?? {}) as { years?: unknown };
    const years = typeof c.years === 'number' && Number.isFinite(c.years) ? clamp(Math.round(c.years), 2, 30) : 10;
    const rng = new SeededRandom(seed);
    const persona = rng.pick(PERSONAS);
    return {
      ...this.baseState(seed),
      rngState: rng.state,
      totalTurns: 2,
      phase: 'ALLOCATE',
      persona,
      allocation: null,
      sip: 0,
      holdings: { equity: 0, debt: 0, gold: 0, cash: 0 },
      invested: 0,
      year: 0,
      years,
      midYear: Math.floor(years / 2),
      history: [],
      driftAtReview: null,
      rebalanced: null,
      rebalanceScore: 0,
      riskFit: 0,
      sipScore: 0,
    };
  }

  getAvailableActions(state: PortfolioBuilderState): Action[] {
    if (state.phase === 'ALLOCATE') {
      return [{ type: 'ALLOCATE', label: 'Lock in portfolio', hint: 'payload: { equity, debt, gold, cash, sip }' }];
    }
    if (state.phase === 'REVIEW') {
      return [
        { type: 'REBALANCE', label: 'Rebalance to my original mix', hint: 'Sell what grew, buy what shrank' },
        { type: 'HOLD', label: 'Hold — let it ride', hint: 'Keep the drifted mix' },
      ];
    }
    return [];
  }

  isFinished(state: PortfolioBuilderState): boolean {
    return state.phase === 'DONE';
  }

  private simulateYears(state: PortfolioBuilderState, years: number, rng: SeededRandom) {
    const alloc = state.allocation!;
    for (let i = 0; i < years; i++) {
      const yearly = state.sip * 12;
      for (const k of CLASSES) {
        const m = CLASS_MODEL[k];
        const r = m.sigma === 0 ? m.mu : Math.max(-0.6, rng.normal(m.mu, m.sigma));
        const add = Math.round((yearly * alloc[k]) / 100);
        // SIP arrives through the year, so it earns about half a year's return.
        state.holdings[k] = Math.round(state.holdings[k] * (1 + r) + add * (1 + r / 2));
      }
      state.invested += yearly;
      state.year += 1;
      state.history.push({ year: state.year, value: sum(state.holdings), invested: state.invested });
    }
  }

  private currentMix(state: PortfolioBuilderState): Allocation {
    const total = sum(state.holdings) || 1;
    return Object.fromEntries(CLASSES.map((k) => [k, Math.round((state.holdings[k] / total) * 100)])) as Allocation;
  }

  protected step(state: PortfolioBuilderState, action: Action, rng: SeededRandom): GameEvent[] {
    const events: GameEvent[] = [];
    const p = state.persona;
    if (action.type === 'ALLOCATE') {
      const raw = action.payload ?? {};
      if (CLASSES.some((k) => typeof raw[k] !== 'number') || typeof raw.sip !== 'number') {
        throw new GameRuleError('INVALID_ALLOCATION', 'Shares and SIP must be numbers.');
      }
      const alloc = Object.fromEntries(CLASSES.map((k) => [k, raw[k] as number])) as Allocation;
      if (CLASSES.some((k) => !Number.isInteger(alloc[k]) || alloc[k] < 0 || alloc[k] > 100)) throw new GameRuleError('INVALID_ALLOCATION', 'Each share must be a whole number from 0 to 100.');
      if (sum(alloc) !== 100) throw new GameRuleError('ALLOCATION_NOT_100', 'Your allocation must add up to 100%.');
      const sip = raw.sip as number;
      if (!Number.isInteger(sip) || sip < 0) throw new GameRuleError('INVALID_SIP', 'Enter a valid monthly SIP.');
      if (sip > p.monthlyBudget) throw new GameRuleError('SIP_OVER_BUDGET', `${p.name} can afford at most ₹${p.monthlyBudget / 100} a month.`);

      state.allocation = alloc;
      state.sip = sip;
      for (const k of CLASSES) state.holdings[k] = Math.round((p.lumpSum * alloc[k]) / 100);
      state.invested = p.lumpSum;
      state.history = [{ year: 0, value: p.lumpSum, invested: p.lumpSum }];

      // Risk fit
      const [lo, hi] = p.equityBand;
      const eq = alloc.equity;
      const off = eq < lo ? lo - eq : eq > hi ? eq - hi : 0;
      state.riskFit = Math.round(clamp(300 - off * 8, 0, 300) - (alloc.cash < p.minCash ? 100 : 0) - (alloc.cash > 30 ? 60 : 0));
      state.riskFit = Math.max(0, state.riskFit);
      state.sipScore = Math.round(clamp(sip / (p.monthlyBudget * 0.6), 0, 1) * 150);
      events.push({ kind: 'CONSEQUENCE', message: off === 0 ? `✅ ${eq}% equity suits a ${p.risk.toLowerCase()} investor like ${p.name}.` : `⚠️ ${eq}% equity is ${eq < lo ? 'too cautious' : 'too risky'} for ${p.name}’s ${p.risk.toLowerCase()} profile.` });
      if (CLASSES.filter((k) => alloc[k] > 0).length >= 3) state.learned.push('Asset allocation — how you split money across classes — drives most of your result.');
      if (sip > 0) state.learned.push('A monthly SIP builds wealth steadily and averages out market ups and downs.');

      this.simulateYears(state, state.midYear, rng);
      state.driftAtReview = this.currentMix(state);
      const value = sum(state.holdings);
      events.push({ kind: 'MARKET_NEWS', message: `⏩ ${state.midYear} years later: portfolio worth ₹${Math.round(value / 100).toLocaleString('en-IN')}` });
      const drift = Math.abs(state.driftAtReview.equity - alloc.equity);
      events.push({ kind: 'TIP', message: drift > 8 ? `Your equity share drifted from ${alloc.equity}% to ${state.driftAtReview.equity}%. Time to decide: rebalance or hold?` : 'Your mix stayed close to plan. Rebalancing is optional this time.' });
      state.phase = 'REVIEW';
      state.score = this.scoreOf(state);
      return events;
    }

    // REBALANCE or HOLD at the midpoint
    const alloc = state.allocation!;
    const drift = Math.abs(state.driftAtReview!.equity - alloc.equity);
    const rebalance = action.type === 'REBALANCE';
    if (rebalance) {
      const total = sum(state.holdings);
      for (const k of CLASSES) state.holdings[k] = Math.round((total * alloc[k]) / 100);
      events.push({ kind: 'CONSEQUENCE', message: '⚖️ Rebalanced back to your target mix.' });
    } else {
      events.push({ kind: 'CONSEQUENCE', message: '🧘 Holding the drifted mix.' });
    }
    state.rebalanced = rebalance;
    state.rebalanceScore = drift > 8 ? (rebalance ? 150 : 40) : rebalance ? 120 : 150;
    state.learned.push('Rebalancing once in a while keeps your risk where you planned it.');

    this.simulateYears(state, state.years - state.midYear, rng);
    const value = sum(state.holdings);
    const reached = value >= p.goal;
    events.push({ kind: 'MARKET_NEWS', message: `🏁 Year ${state.years}: ₹${Math.round(value / 100).toLocaleString('en-IN')} — ${reached ? 'goal reached! 🎉' : 'short of the goal.'}` });
    events.push({ kind: 'TIP', message: `${p.name} invested ₹${Math.round(state.invested / 100).toLocaleString('en-IN')} in total. Compounding did the rest.` });
    state.phase = 'DONE';
    state.score = this.scoreOf(state);
    return events;
  }

  private scoreOf(state: PortfolioBuilderState): number {
    const value = sum(state.holdings);
    const ratio = state.persona.goal > 0 ? clamp(value / state.persona.goal, 0, 1) : 0;
    const goalPart = ratio * (state.phase === 'DONE' ? 400 : 200);
    const total = Math.round(clamp(goalPart + state.riskFit + state.sipScore + state.rebalanceScore, 0, 1000));
    return Number.isFinite(total) ? total : 0;
  }

  computeResult(state: PortfolioBuilderState): GameResult {
    const finalScore = this.scoreOf(state);
    const value = sum(state.holdings);
    // Token slices (under 5%) don't count as diversification.
    const assetTypes = state.allocation ? CLASSES.filter((k) => state.allocation![k] >= 5).length : 0;
    return {
      finalScore,
      performance: clamp(finalScore / 1000, 0, 1) || 0,
      goalReached: state.phase === 'DONE' && value >= state.persona.goal && state.riskFit >= 200,
      learnings: this.summarizeLearnings(state, [
        'Match your mix to your goal, time horizon and stomach for risk.',
        'A monthly SIP builds wealth steadily and averages out market ups and downs.',
        'Rebalancing once in a while keeps your risk where you planned it.',
      ]),
      stats: {
        persona: state.persona.name,
        assetTypes,
        finalValue: Math.round(value / 100),
        invested: Math.round(state.invested / 100),
        riskFit: state.riskFit,
        rebalanced: state.rebalanced === null ? 'n/a' : state.rebalanced ? 'yes' : 'no',
      },
    };
  }
}

export const portfolioBuilderEngine = new PortfolioBuilderEngine();
