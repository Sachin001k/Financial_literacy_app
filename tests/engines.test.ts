import { describe, expect, it } from 'vitest';
import { GAMES, ONBOARDING_MISSIONS } from '@/lib/content/games';
import { registry } from '@/lib/game/registry';
import { SeededRandom } from '@/lib/game/seeded-random';
import type { Action, GameEngine, GameState } from '@/lib/game/types';

const user = { id: 'u1', familiarity: 'BEGINNER' as const };

/** Turns a generic action into a concrete, valid one for engines that need payloads. */
function concretize(slug: string, state: GameState, actions: Action[], rng: SeededRandom): Action {
  if (slug === 'investment-simulator') {
    const s = state as any;
    const affordable = s.assets.filter((a: any) => s.prices[a.symbol] <= s.portfolio.cash);
    if (s.tradesThisYear < 3 && affordable.length && rng.next() < 0.7) {
      const a = rng.pick(affordable) as any;
      const qty = Math.max(1, Math.floor(s.portfolio.cash / 4 / s.prices[a.symbol]));
      return { type: 'BUY', payload: { symbol: a.symbol, qty } };
    }
    return { type: 'NEXT_YEAR' };
  }
  if (slug === 'portfolio-builder' && actions[0]?.type === 'ALLOCATE') {
    const s = state as any;
    return { type: 'ALLOCATE', payload: { equity: 60, debt: 25, gold: 10, cash: 5, sip: s.persona.monthlyBudget } };
  }
  const a = rng.pick(actions);
  return { type: a.type, payload: a.payload };
}

function playThrough(engine: GameEngine<GameState>, slug: string, config: unknown, seed: number) {
  let state = engine.init(config, user, seed);
  const rng = new SeededRandom(seed ^ 0xabc);
  const log: Action[] = [];
  let guard = 0;
  while (!engine.isFinished(state) && guard++ < 500) {
    const action = concretize(slug, state, engine.getAvailableActions(state), rng);
    log.push(action);
    state = engine.applyAction(state, action).state;
  }
  return { state, log };
}

describe.each(GAMES.map((g) => [g.slug, g.config] as const))('%s engine', (slug, config) => {
  const engine = registry.get(slug)!;

  it('is registered', () => expect(engine).toBeDefined());

  it('initialises with totalTurns and learned', () => {
    const s = engine.init(config, user, 42) as any;
    expect(s.turn).toBe(0);
    expect(typeof s.totalTurns).toBe('number');
    expect(Array.isArray(s.learned)).toBe(true);
    expect(() => JSON.parse(JSON.stringify(s))).not.toThrow();
    expect(engine.getAvailableActions(s).length).toBeGreaterThan(0);
  });

  it('plays to the end with valid results', () => {
    for (const seed of [1, 7, 99, 12345]) {
      const { state } = playThrough(engine, slug, config, seed);
      expect(engine.isFinished(state)).toBe(true);
      expect(state.finished).toBe(true);
      const r = engine.computeResult(state);
      expect(r.finalScore).toBeGreaterThanOrEqual(0);
      expect(r.finalScore).toBeLessThanOrEqual(1000);
      expect(r.performance).toBeGreaterThanOrEqual(0);
      expect(r.performance).toBeLessThanOrEqual(1);
      expect(r.learnings.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic for the same seed and actions', () => {
    const a = playThrough(engine, slug, config, 2024);
    let state = engine.init(config, user, 2024);
    for (const action of a.log) state = engine.applyAction(state, action).state;
    expect(state).toEqual(a.state);
  });

  it('rejects actions after the game ends', () => {
    const { state } = playThrough(engine, slug, config, 5);
    expect(() => engine.applyAction(state, { type: 'ANYTHING' })).toThrow();
  });

  it('can compute a result for a force-ended game', () => {
    const s = engine.init(config, user, 3);
    const r = engine.computeResult({ ...s, finished: true });
    expect(r.finalScore).toBeGreaterThanOrEqual(0);
  });
});

describe('achievement stats', () => {
  it('investment-simulator reports trades and assetTypes', () => {
    const e = registry.get('investment-simulator')!;
    const { state } = playThrough(e, 'investment-simulator', GAMES[1].config, 8);
    const r = e.computeResult(state);
    expect(r.stats).toHaveProperty('trades');
    expect(r.stats).toHaveProperty('assetTypes');
  });
  it('scam-or-legit reports scamsMissed; bull-or-bear bestStreak; portfolio-builder assetTypes', () => {
    for (const [slug, key] of [['scam-or-legit', 'scamsMissed'], ['bull-or-bear', 'bestStreak'], ['portfolio-builder', 'assetTypes']] as const) {
      const e = registry.get(slug)!;
      const { state } = playThrough(e, slug, GAMES.find((g) => g.slug === slug)!.config, 11);
      expect(e.computeResult(state).stats).toHaveProperty(key);
    }
  });
});

describe('rules', () => {
  it('portfolio builder rejects allocations that do not sum to 100', () => {
    const e = registry.get('portfolio-builder')!;
    const s = e.init({}, user, 1);
    expect(() => e.applyAction(s, { type: 'ALLOCATE', payload: { equity: 50, debt: 20, gold: 10, cash: 10, sip: 0 } })).toThrow(/100/);
  });
  it('investment simulator rejects buying more than cash allows', () => {
    const e = registry.get('investment-simulator')!;
    const s = e.init({ years: 5, startingCash: 100000 }, user, 1);
    expect(() => e.applyAction(s, { type: 'BUY', payload: { symbol: 'TECHNOVA', qty: 1 } })).toThrow();
  });
  it('onboarding missions initialise', () => {
    for (const m of Object.values(ONBOARDING_MISSIONS)) {
      const { state } = playThrough(registry.get(m.slug)!, m.slug, m.config, 9);
      expect(state.finished).toBe(true);
    }
  });
  it('money challenges never leaks the answer in state', () => {
    const e = registry.get('money-challenges')!;
    const s = e.init({ cards: 10 }, user, 4) as any;
    expect(JSON.stringify(s.current)).not.toContain('correctIndex');
  });
});

describe('public state redaction', () => {
  const PRIVATE_KEYS = ['rngState', 'hidden', 'perms', 'schedule'];

  it.each(GAMES.map((g) => [g.slug, g.config] as const))('%s publicState hides RNG and answers', (slug, config) => {
    const e = registry.get(slug)!;
    const { log } = playThrough(e, slug, config, 77);
    let state = e.init(config, user, 77);
    const check = (s: GameState) => {
      const pub = e.publicState(s) as Record<string, unknown>;
      for (const k of PRIVATE_KEYS) expect(pub).not.toHaveProperty(k);
      if (Array.isArray(pub.deck)) {
        expect((pub.deck as string[]).every((id) => id === '')).toBe(true);
        expect((pub.deck as string[]).length).toBe((s as any).deck.length);
      }
      const json = JSON.stringify(pub);
      if (Array.isArray((s as any).deck)) for (const id of (s as any).deck as string[]) expect(json).not.toContain(`"${id}"`);
    };
    check(state);
    for (const a of log) {
      state = e.applyAction(state, a).state;
      check(state);
    }
  });
});

describe('exploit regressions', () => {
  function playAll(slug: string, config: unknown, seed: number, pick: (s: any) => Action) {
    const e = registry.get(slug)!;
    let s = e.init(config, user, seed);
    while (!e.isFinished(s)) s = e.applyAction(s, pick(s)).state;
    return e.computeResult(s);
  }

  it('always calling SCAM does not reach the goal', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const r = playAll('scam-or-legit', { cards: 12 }, seed, () => ({ type: 'SCAM' }));
      expect(r.goalReached).toBe(false);
      expect(Number(r.stats.falseAlarms)).toBeGreaterThan(1);
    }
  });

  it('always picking the same option in money challenges does not systematically win', () => {
    for (const choice of [0, 1, 2]) {
      let wins = 0;
      for (let seed = 1; seed <= 100; seed++) {
        const r = playAll('money-challenges', { cards: 10 }, seed, () => ({ type: 'ANSWER', payload: { choice } }));
        if (r.goalReached) wins++;
      }
      expect(wins).toBeLessThan(20);
    }
  });

  it('money challenges grades against the shuffled option order', () => {
    const e = registry.get('money-challenges')!;
    let s = e.init({ cards: 10 }, user, 3) as any;
    const out = e.applyAction(s, { type: 'ANSWER', payload: { choice: 0 } });
    s = out.state;
    const r = s.lastReveal;
    expect(r.correct).toBe(r.choice === r.correctIndex);
  });

  it('buy-and-sell round trips do not count as diversification', () => {
    const e = registry.get('investment-simulator')!;
    let s = e.init({ years: 5, startingCash: 10000000 }, user, 1);
    for (const symbol of ['FD', 'GOVTBOND', 'GOLDETF', 'FLEXICAP']) {
      s = e.applyAction(s, { type: 'BUY', payload: { symbol, qty: 1 } }).state;
      s = e.applyAction(s, { type: 'SELL', payload: { symbol, qty: 1 } }).state;
    }
    while (!e.isFinished(s)) s = e.applyAction(s, { type: 'NEXT_YEAR' }).state;
    const r = e.computeResult(s);
    expect(r.stats.assetTypes).toBe(0);
    expect(r.stats.trades).toBe(8);
  });

  it('a real diversified portfolio is recognised', () => {
    const e = registry.get('investment-simulator')!;
    let s = e.init({ years: 5, startingCash: 10000000 }, user, 1) as any;
    for (const symbol of ['NIFTYIDX', 'GOVTBOND', 'GOLDETF', 'DAILYNEEDS']) {
      const qty = Math.floor(2000000 / s.prices[symbol]);
      s = e.applyAction(s, { type: 'BUY', payload: { symbol, qty } }).state;
    }
    s = e.applyAction(s, { type: 'NEXT_YEAR' }).state;
    expect(s.maxAssetTypes).toBe(4);
  });

  it('rejects non-number payload fields', () => {
    const inv = registry.get('investment-simulator')!;
    const s1 = inv.init({ years: 5, startingCash: 10000000 }, user, 1);
    expect(() => inv.applyAction(s1, { type: 'BUY', payload: { symbol: 'FD', qty: '1' } })).toThrow();
    expect(() => inv.applyAction(s1, { type: 'BUY', payload: { symbol: 'FD', qty: true } })).toThrow();
    const mc = registry.get('money-challenges')!;
    const s2 = mc.init({ cards: 10 }, user, 1);
    expect(() => mc.applyAction(s2, { type: 'ANSWER', payload: { choice: true } })).toThrow();
    const pb = registry.get('portfolio-builder')!;
    const s3 = pb.init({}, user, 1);
    expect(() => pb.applyAction(s3, { type: 'ALLOCATE', payload: { equity: 60, debt: 30, gold: 10, cash: null, sip: 0 } })).toThrow();
  });

  it('portfolio builder honours config.years', () => {
    const e = registry.get('portfolio-builder')!;
    let s = e.init({ years: 6 }, user, 2) as any;
    s = e.applyAction(s, { type: 'ALLOCATE', payload: { equity: 50, debt: 30, gold: 10, cash: 10, sip: 0 } }).state;
    expect(s.year).toBe(3);
    s = e.applyAction(s, { type: 'HOLD' }).state;
    expect(s.year).toBe(6);
  });

  it('zero-goal configs never produce NaN', () => {
    const life = registry.get('life-simulator')!;
    const s = life.init({ months: 2, income: 100000, savingsGoal: 0 }, user, 1);
    const r = life.computeResult({ ...s, finished: true });
    expect(Number.isFinite(r.performance)).toBe(true);
    const inv = registry.get('investment-simulator')!;
    let si = inv.init({ years: 1, startingCash: 0 }, user, 1);
    si = inv.applyAction(si, { type: 'NEXT_YEAR' }).state;
    const ri = inv.computeResult(si);
    expect(Number.isFinite(ri.performance)).toBe(true);
    expect(Number.isFinite(ri.finalScore)).toBe(true);
  });

  it('investment simulator progress never exceeds 100% and ends at 100%', () => {
    const e = registry.get('investment-simulator')!;
    const { state } = playThrough(e, 'investment-simulator', { years: 5, startingCash: 10000000 }, 4);
    expect(state.turn).toBe((state as any).totalTurns);
  });

  it('life simulator score is current after a DECIDE', () => {
    const e = registry.get('life-simulator')! as any;
    for (let seed = 1; seed < 40; seed++) {
      let s = e.init({ months: 12, income: 2500000, savingsGoal: 1500000 }, user, seed);
      let guard = 0;
      while (!e.isFinished(s) && guard++ < 100) {
        const actions = e.getAvailableActions(s);
        const a = actions[0];
        s = e.applyAction(s, { type: a.type, payload: a.payload }).state;
        if (a.type === 'DECIDE') {
          expect(s.score).toBe(e.computeResult(s).finalScore);
          return;
        }
      }
    }
  });
});
