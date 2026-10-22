import { hashString, SeededRandom } from '@/lib/game/seeded-random';

export type AssetType = 'STOCK' | 'INDEX_FUND' | 'MUTUAL_FUND' | 'GOLD' | 'FD' | 'BOND';

export interface AssetDef {
  symbol: string;
  name: string;
  type: AssetType;
  sector?: string;
  /** 1 (very safe) – 5 (very risky) */
  risk: 1 | 2 | 3 | 4 | 5;
  /** Expected yearly return and volatility used by the simulator (synthetic, educational). */
  mu: number;
  sigma: number;
  /** Starting price in paise. */
  basePrice: number;
  blurb: string;
}

// Fictional instruments modelled on Indian asset classes. Prices are synthetic and for learning only.
export const ASSETS: AssetDef[] = [
  { symbol: 'NIFTYIDX', name: 'Nifty 50 Index Fund', type: 'INDEX_FUND', risk: 3, mu: 0.11, sigma: 0.16, basePrice: 25000, blurb: 'Owns the 50 biggest Indian companies in one go.' },
  { symbol: 'TECHNOVA', name: 'TechNova Ltd', type: 'STOCK', sector: 'IT', risk: 4, mu: 0.14, sigma: 0.32, basePrice: 145000, blurb: 'A fast-growing software exporter.' },
  { symbol: 'BHARATBNK', name: 'Bharat Bank', type: 'STOCK', sector: 'Banking', risk: 4, mu: 0.12, sigma: 0.28, basePrice: 82000, blurb: 'A large private bank, sensitive to interest rates.' },
  { symbol: 'GREENGRID', name: 'GreenGrid Power', type: 'STOCK', sector: 'Energy', risk: 5, mu: 0.16, sigma: 0.45, basePrice: 21000, blurb: 'A young solar company: big dreams, big swings.' },
  { symbol: 'DAILYNEEDS', name: 'DailyNeeds FMCG', type: 'STOCK', sector: 'Consumer', risk: 2, mu: 0.1, sigma: 0.15, basePrice: 240000, blurb: 'Soap, biscuits and tea. Steady and boring.' },
  { symbol: 'FLEXICAP', name: 'Flexicap Mutual Fund', type: 'MUTUAL_FUND', risk: 3, mu: 0.12, sigma: 0.18, basePrice: 6000, blurb: 'A fund manager picks stocks across sizes for you.' },
  { symbol: 'GOLDETF', name: 'Gold ETF', type: 'GOLD', risk: 2, mu: 0.08, sigma: 0.13, basePrice: 6200, blurb: 'Tracks the gold price; often rises when stocks fall.' },
  { symbol: 'GOVTBOND', name: 'Govt Bond Fund', type: 'BOND', risk: 1, mu: 0.07, sigma: 0.04, basePrice: 1000, blurb: 'Lends to the government. Low risk, low return.' },
  { symbol: 'FD', name: 'Fixed Deposit', type: 'FD', risk: 1, mu: 0.065, sigma: 0, basePrice: 100, blurb: 'Guaranteed 6.5% a year. Safe, but barely beats inflation.' },
];

export const getAsset = (symbol: string) => ASSETS.find((a) => a.symbol === symbol);

export interface Bar {
  date: string; // YYYY-MM-DD
  open: number; // paise
  high: number;
  low: number;
  close: number;
  volume: number;
}

const DAY = 86_400_000;
const EPOCH = Date.UTC(2021, 0, 1);

/** Deterministic synthetic daily bars per symbol (weekdays only), from 2021-01-01 to `until`. */
export function barsFor(symbol: string, from?: string, to?: string): Bar[] | undefined {
  const asset = getAsset(symbol);
  if (!asset) return undefined;
  const rng = new SeededRandom(hashString(`bars:${symbol}`));
  const end = to ? Date.parse(to) : Date.now();
  const start = from ? Date.parse(from) : end - 180 * DAY;
  const out: Bar[] = [];
  let price = asset.basePrice;
  const dMu = asset.mu / 252;
  const dSigma = asset.sigma / Math.sqrt(252);
  for (let t = EPOCH; t <= end; t += DAY) {
    const dow = new Date(t).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const open = price;
    const ret = asset.sigma === 0 ? asset.mu / 365 : rng.normal(dMu, dSigma);
    const close = Math.max(1, Math.round(open * (1 + ret)));
    const wick = Math.abs(rng.normal(0, dSigma / 2));
    const high = Math.round(Math.max(open, close) * (1 + wick));
    const low = Math.round(Math.min(open, close) * (1 - wick));
    const volume = Math.round(1_00_000 * (1 + Math.abs(ret) * 40) * (0.6 + rng.next()));
    price = close;
    if (t >= start) out.push({ date: new Date(t).toISOString().slice(0, 10), open, high, low, close, volume });
  }
  return out;
}

/** A self-contained random walk for chart games: `n` bars with an optional drift. */
export function randomBars(rng: SeededRandom, n: number, startPrice: number, sigma: number, drift = 0): Bar[] {
  const bars: Bar[] = [];
  let price = startPrice;
  let day = Date.UTC(2024, 0, 1);
  for (let i = 0; i < n; i++) {
    const open = price;
    const close = Math.max(1, Math.round(open * (1 + rng.normal(drift, sigma))));
    const wick = Math.abs(rng.normal(0, sigma / 2));
    bars.push({
      date: new Date(day).toISOString().slice(0, 10),
      open,
      high: Math.round(Math.max(open, close) * (1 + wick)),
      low: Math.round(Math.min(open, close) * (1 - wick)),
      close,
      volume: Math.round(50_000 + rng.next() * 100_000),
    });
    price = close;
    day += DAY;
  }
  return bars;
}
