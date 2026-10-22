import { ASSETS, getAsset, type AssetDef } from '@/lib/content/market';
import { BaseGameEngine, clamp, type BaseState } from '../base-engine';
import type { SeededRandom } from '../seeded-random';
import { GameRuleError, type Action, type EngineUser, type GameEvent, type GameResult } from '../types';

// ── Portfolio helpers (plain data so state stays JSON) ──

export interface Holding {
  symbol: string;
  qty: number;
  avgPrice: number; // paise
}

export interface Portfolio {
  cash: number; // paise
  holdings: Holding[];
}

export function portfolioBuy(p: Portfolio, symbol: string, qty: number, price: number): void {
  const cost = qty * price;
  if (cost > p.cash) throw new GameRuleError('INSUFFICIENT_CASH', 'Not enough cash for that order.');
  p.cash -= cost;
  const h = p.holdings.find((x) => x.symbol === symbol);
  if (h) {
    h.avgPrice = Math.round((h.avgPrice * h.qty + cost) / (h.qty + qty));
    h.qty += qty;
  } else p.holdings.push({ symbol, qty, avgPrice: price });
}

export function portfolioSell(p: Portfolio, symbol: string, qty: number, price: number): void {
  const h = p.holdings.find((x) => x.symbol === symbol);
  if (!h || h.qty < qty) throw new GameRuleError('INSUFFICIENT_UNITS', 'You don’t own that many units.');
  h.qty -= qty;
  p.cash += qty * price;
  if (h.qty === 0) p.holdings = p.holdings.filter((x) => x.symbol !== symbol);
}

export function portfolioValue(p: Portfolio, prices: Record<string, number>): number {
  return p.cash + p.holdings.reduce((s, h) => s + h.qty * (prices[h.symbol] ?? 0), 0);
}

export function portfolioAllocation(p: Portfolio, prices: Record<string, number>): Record<string, number> {
  const total = portfolioValue(p, prices) || 1;
  const out: Record<string, number> = { CASH: p.cash / total };
  for (const h of p.holdings) {
    const type = getAsset(h.symbol)?.type ?? 'STOCK';
    out[type] = (out[type] ?? 0) + (h.qty * (prices[h.symbol] ?? 0)) / total;
  }
  return out;
}

// ── Market simulator ──

interface MarketEventDef {
  headline: string;
  /** Extra yearly return by symbol, asset type or sector. */
  impact: Record<string, number>;
  lesson: string;
}

const MARKET_EVENTS: MarketEventDef[] = [
  { headline: 'RBI raises repo rate; bank stocks dip', impact: { Banking: -0.12, BOND: -0.02, FD: 0 }, lesson: 'Higher interest rates often pressure bank and growth stocks.' },
  { headline: 'Global tech boom lifts IT exporters', impact: { IT: 0.2, INDEX_FUND: 0.04 }, lesson: 'Sectors can rally together on global trends.' },
  { headline: 'Market crash: Nifty falls 20% on global recession fears', impact: { STOCK: -0.22, INDEX_FUND: -0.2, MUTUAL_FUND: -0.18, GOLD: 0.1 }, lesson: 'Crashes are normal. Investors who stay put usually recover.' },
  { headline: 'Bull run! Strong GDP growth lifts all boats', impact: { STOCK: 0.15, INDEX_FUND: 0.14, MUTUAL_FUND: 0.13 }, lesson: 'In good years, equity beats safe assets by a wide margin.' },
  { headline: 'Government announces big solar subsidies', impact: { Energy: 0.35 }, lesson: 'Policy news can move a single sector sharply.' },
  { headline: 'Solar startup misses targets, shares tumble', impact: { Energy: -0.35 }, lesson: 'Single stocks can fall hard. Diversify so one loss doesn’t sink you.' },
  { headline: 'Inflation spikes; gold shines', impact: { GOLD: 0.15, BOND: -0.03, Consumer: -0.05 }, lesson: 'Gold often holds value when inflation rises.' },
  { headline: 'Quiet year: markets move sideways', impact: {}, lesson: 'Some years nothing happens. Patience is part of investing.' },
  { headline: 'Bank fraud scandal hits Bharat Bank', impact: { BHARATBNK: -0.3 }, lesson: 'Company-specific risk is why you don’t bet everything on one stock.' },
  { headline: 'Rate cuts boost bonds and banks', impact: { BOND: 0.04, Banking: 0.12 }, lesson: 'Falling rates raise bond prices.' },
];

export interface InvestSimState extends BaseState {
  totalTurns: number;
  year: number;
  years: number;
  startValue: number;
  portfolio: Portfolio;
  prices: Record<string, number>;
  history: { year: number; value: number; fd: number }[];
  news: { headline: string; lesson: string } | null;
  trades: number;
  tradesThisYear: number;
  panicSells: number;
  lastReturns: Record<string, number>;
  peakValue: number;
  maxDrawdown: number;
  /** Most asset types held (each ≥5% of value) at any year end. */
  maxAssetTypes: number;
  /** Year ends at which something other than cash was held. */
  yearsInvested: number;
  mission: boolean;
  assets: { symbol: string; name: string; type: string; risk: number; blurb: string }[];
}

const MAX_TRADES_PER_YEAR = 12;
const MIN_TYPE_WEIGHT = 0.05;

/** Asset types that each make up at least 5% of the portfolio, so token positions don't count as diversification. */
function meaningfulTypes(p: Portfolio, prices: Record<string, number>): number {
  const alloc = portfolioAllocation(p, prices);
  return Object.entries(alloc).filter(([type, w]) => type !== 'CASH' && w >= MIN_TYPE_WEIGHT).length;
}

/** Remaining turns if the player only advances years from here; keeps progress at or below 100%. */
const turnsLeft = (state: InvestSimState) => state.years - state.year;
const FD_RATE = 0.065;

function yearlyReturn(asset: AssetDef, rng: SeededRandom, event: MarketEventDef): number {
  const base = asset.sigma === 0 ? asset.mu : rng.normal(asset.mu, asset.sigma);
  const extra = (event.impact[asset.symbol] ?? 0) + (event.impact[asset.type] ?? 0) + (asset.sector ? event.impact[asset.sector] ?? 0 : 0);
  return asset.type === 'FD' ? asset.mu : Math.max(-0.8, base + extra);
}

export class InvestmentSimulatorEngine extends BaseGameEngine<InvestSimState> {
  readonly slug = 'investment-simulator';

  init(config: unknown, _user: EngineUser, seed: number): InvestSimState {
    const c = (config ?? {}) as { years?: number; startingCash?: number; mission?: boolean };
    const years = clamp(Math.round(c.years ?? 5), 1, 10);
    const cash = Math.round(c.startingCash ?? 10000000);
    const prices = Object.fromEntries(ASSETS.map((a) => [a.symbol, a.basePrice]));
    return {
      ...this.baseState(seed),
      totalTurns: years,
      year: 0,
      years,
      startValue: cash,
      portfolio: { cash, holdings: [] },
      prices,
      history: [{ year: 0, value: cash, fd: cash }],
      news: null,
      trades: 0,
      tradesThisYear: 0,
      panicSells: 0,
      lastReturns: {},
      peakValue: cash,
      maxDrawdown: 0,
      maxAssetTypes: 0,
      yearsInvested: 0,
      mission: Boolean(c.mission),
      assets: ASSETS.map(({ symbol, name, type, risk, blurb }) => ({ symbol, name, type, risk, blurb })),
    };
  }

  getAvailableActions(state: InvestSimState): Action[] {
    if (state.year >= state.years) return [];
    const actions: Action[] = [];
    if (state.tradesThisYear < MAX_TRADES_PER_YEAR) {
      actions.push({ type: 'BUY', label: 'Buy', hint: 'payload: { symbol, qty }' });
      if (state.portfolio.holdings.length) actions.push({ type: 'SELL', label: 'Sell', hint: 'payload: { symbol, qty }' });
    }
    actions.push({ type: 'NEXT_YEAR', label: state.year + 1 === state.years ? 'Finish final year' : `Advance to year ${state.year + 1}`, hint: 'Let the market move' });
    return actions;
  }

  isFinished(state: InvestSimState): boolean {
    return state.year >= state.years;
  }

  protected step(state: InvestSimState, action: Action, rng: SeededRandom): GameEvent[] {
    const events: GameEvent[] = [];
    if (action.type === 'BUY' || action.type === 'SELL') {
      const symbol = action.payload?.symbol;
      const qty = action.payload?.qty;
      if (typeof symbol !== 'string') throw new GameRuleError('UNKNOWN_ASSET', 'Pick a valid asset.');
      if (typeof qty !== 'number') throw new GameRuleError('INVALID_QTY', 'Quantity must be a whole number above zero.');
      const asset = getAsset(symbol);
      if (!asset) throw new GameRuleError('UNKNOWN_ASSET', 'Pick a valid asset.');
      if (!Number.isInteger(qty) || qty <= 0) throw new GameRuleError('INVALID_QTY', 'Quantity must be a whole number above zero.');
      const price = state.prices[symbol];
      if (action.type === 'BUY') {
        portfolioBuy(state.portfolio, symbol, qty, price);
        events.push({ kind: 'WALLET', message: `Bought ${qty} × ${asset.name}`, delta: -qty * price });
      } else {
        const h = state.portfolio.holdings.find((x) => x.symbol === symbol);
        const atLoss = h ? price < h.avgPrice : false;
        portfolioSell(state.portfolio, symbol, qty, price);
        events.push({ kind: 'WALLET', message: `Sold ${qty} × ${asset.name}`, delta: qty * price });
        if (atLoss && (state.lastReturns[symbol] ?? 0) < -0.05) {
          state.panicSells += 1;
          const tip = 'Selling right after a fall locks in the loss. Panic selling is the most common investing mistake.';
          if (!state.learned.includes(tip)) state.learned.push(tip);
          events.push({ kind: 'TIP', message: tip });
        }
      }
      state.trades += 1;
      state.tradesThisYear += 1;
      // step() runs before the base class bumps `turn`, so the new turn is state.turn + 1.
      state.totalTurns = state.turn + 1 + turnsLeft(state);
      state.score = this.scoreOf(state);
      return events;
    }

    // NEXT_YEAR: the market moves
    const before = portfolioValue(state.portfolio, state.prices);
    const event = rng.pick(MARKET_EVENTS);
    state.news = { headline: event.headline, lesson: event.lesson };
    events.push({ kind: 'MARKET_NEWS', message: `📰 ${event.headline}` });
    const returns: Record<string, number> = {};
    for (const asset of ASSETS) {
      const r = yearlyReturn(asset, rng, event);
      returns[asset.symbol] = r;
      state.prices[asset.symbol] = Math.max(1, Math.round(state.prices[asset.symbol] * (1 + r)));
    }
    // Idle cash earns a savings-account rate
    state.portfolio.cash = Math.round(state.portfolio.cash * 1.03);
    state.lastReturns = returns;
    state.year += 1;
    state.tradesThisYear = 0;
    const value = portfolioValue(state.portfolio, state.prices);
    const fd = Math.round(state.startValue * Math.pow(1 + FD_RATE, state.year));
    state.history.push({ year: state.year, value, fd });
    state.peakValue = Math.max(state.peakValue, value);
    state.maxDrawdown = state.peakValue > 0 ? Math.max(state.maxDrawdown, (state.peakValue - value) / state.peakValue) : state.maxDrawdown;
    const change = before > 0 ? (value - before) / before : 0;
    events.push({
      kind: 'CONSEQUENCE',
      message: `Year ${state.year}: portfolio ${change >= 0 ? '▲ +' : '▼ '}${(change * 100).toFixed(1)}%`,
      delta: value - before,
    });
    if (!state.learned.includes(event.lesson)) state.learned.push(event.lesson);
    events.push({ kind: 'TIP', message: event.lesson });
    if (state.portfolio.holdings.length === 0) {
      events.push({ kind: 'TIP', message: 'Cash sitting idle loses to inflation. Even a fixed deposit would have earned more.' });
    } else {
      state.yearsInvested += 1;
    }
    // Diversity is judged on what is actually held at year end, weighted by value.
    const types = meaningfulTypes(state.portfolio, state.prices);
    state.maxAssetTypes = Math.max(state.maxAssetTypes, types);
    if (types >= 3) {
      const tip = 'Diversification: owning different asset types smooths the ride.';
      if (!state.learned.includes(tip)) state.learned.push(tip);
    }
    state.totalTurns = state.turn + 1 + turnsLeft(state);
    state.score = this.scoreOf(state);
    return events;
  }

  private cagr(state: InvestSimState): number {
    const value = portfolioValue(state.portfolio, state.prices);
    const yrs = Math.max(1, state.year);
    if (!(state.startValue > 0)) return 0;
    const r = Math.pow(Math.max(value, 1) / state.startValue, 1 / yrs) - 1;
    return Number.isFinite(r) ? r : 0;
  }

  private scoreOf(state: InvestSimState): number {
    if (state.year === 0) return 0;
    const growth = clamp(500 + (this.cagr(state) - FD_RATE) * 5000, 0, 750);
    const diversity = Math.min(state.maxAssetTypes, 4) * 25;
    const invested = state.yearsInvested > 0 ? 50 : 0;
    const penalty = state.maxDrawdown * 300 + state.panicSells * 50;
    const progress = state.year / state.years;
    const total = Math.round(clamp((growth + diversity + invested - penalty) * (0.5 + 0.5 * progress), 0, 1000));
    return Number.isFinite(total) ? total : 0;
  }

  computeResult(state: InvestSimState): GameResult {
    const finalScore = this.scoreOf(state);
    const cagr = state.year ? this.cagr(state) : 0;
    const value = portfolioValue(state.portfolio, state.prices);
    return {
      finalScore,
      performance: clamp(finalScore / 1000, 0, 1) || 0,
      goalReached: state.year >= state.years && cagr > FD_RATE && state.panicSells === 0,
      learnings: this.summarizeLearnings(state, [
        'Diversification: owning different asset types smooths the ride.',
        'Compounding: returns earn returns over time.',
        'Higher risk can mean higher returns — and bigger falls.',
      ]),
      stats: {
        trades: state.trades,
        assetTypes: state.maxAssetTypes,
        cagrPct: Math.round(cagr * 1000) / 10,
        finalValue: Math.round(value / 100),
        maxDrawdownPct: Math.round(state.maxDrawdown * 1000) / 10,
        panicSells: state.panicSells,
      },
    };
  }
}

export const investmentSimulatorEngine = new InvestmentSimulatorEngine();
