import { BaseGameEngine, clamp, type BaseState } from '../base-engine';
import { SeededRandom } from '../seeded-random';
import { GameRuleError, type Action, type EngineUser, type GameEvent, type GameResult, type GameState } from '../types';

interface PlanDef {
  key: string;
  label: string;
  wantsPct: number;
  hint: string;
}

const PLANS: PlanDef[] = [
  { key: 'BALANCED', label: 'Balanced month', wantsPct: 22, hint: 'Some fun, steady saving' },
  { key: 'SAVER', label: 'Saver month', wantsPct: 12, hint: 'Save more, enjoy a bit less' },
  { key: 'TREAT', label: 'Treat yourself', wantsPct: 35, hint: 'Big fun, tiny savings' },
  { key: 'BARE', label: 'Bare minimum', wantsPct: 3, hint: 'Max savings, happiness drops fast' },
];

interface EventOption {
  key: string;
  label: string;
  hint?: string;
  /** Cost as a share of monthly income (negative = money in). */
  cost: number;
  happiness: number;
  message: string;
  tip?: string;
}

interface LifeEventDef {
  id: string;
  emoji: string;
  title: string;
  body: string;
  /** Auto events have exactly one option and apply immediately. */
  options: EventOption[];
}

const EVENTS: LifeEventDef[] = [
  { id: 'phone', emoji: '📱', title: 'Your phone screen cracks', body: 'You need it for college and work.', options: [
    { key: 'REPAIR', label: 'Repair it', hint: 'About 30% of a month’s income', cost: 0.3, happiness: -2, message: 'Fixed the screen. Not fun, but sensible.', tip: 'An emergency fund turns a crisis into an inconvenience.' },
    { key: 'NEW', label: 'Buy the latest model', hint: 'About 1.2× a month’s income', cost: 1.2, happiness: 8, message: 'Shiny new phone! Your savings took a big hit.', tip: 'Upgrades are wants. Repairs are needs.' },
  ] },
  { id: 'wedding', emoji: '💍', title: 'A close friend’s wedding', body: 'Gift, travel and a new outfit add up.', options: [
    { key: 'BIG', label: 'Go all out', hint: '60% of income', cost: 0.6, happiness: 10, message: 'Unforgettable weekend, expensive memories.' },
    { key: 'SMALL', label: 'Thoughtful small gift', hint: '15% of income', cost: 0.15, happiness: 5, message: 'Your friend loved the handwritten note with the gift.', tip: 'Plan for known big expenses months in advance.' },
  ] },
  { id: 'sale', emoji: '🛍️', title: 'Mega festival sale!', body: '“Up to 80% off” on headphones you didn’t know you wanted.', options: [
    { key: 'BUY', label: 'Grab the deal', hint: '40% of income', cost: 0.4, happiness: 4, message: 'Bought it. The excitement faded in a week.' },
    { key: 'SKIP', label: 'Skip it', hint: 'Wait 48 hours rule', cost: 0, happiness: -1, message: 'You waited 48 hours and realised you didn’t need them.', tip: 'A discount on something you don’t need is still spending.' },
  ] },
  { id: 'scamcall', emoji: '📞', title: '“Your bank account will be blocked”', body: 'A caller asks for the OTP to “verify your KYC”.', options: [
    { key: 'SHARE', label: 'Share the OTP', hint: 'They sound official…', cost: 0.8, happiness: -15, message: 'It was a scam. Money gone from your account.', tip: 'No bank ever asks for your OTP. Hang up and call the number on your card.' },
    { key: 'HANGUP', label: 'Hang up and call the bank', cost: 0, happiness: 2, message: 'The bank confirmed it was a scam. Nice catch!', tip: 'No bank ever asks for your OTP.' },
  ] },
  { id: 'trip', emoji: '🏖️', title: 'Friends plan a Goa trip', body: 'Everyone is going. FOMO is real.', options: [
    { key: 'GO', label: 'Go on the trip', hint: '70% of income', cost: 0.7, happiness: 14, message: 'Sun, sand and a lighter wallet.' },
    { key: 'LOCAL', label: 'Suggest a cheaper day trip', hint: '15% of income', cost: 0.15, happiness: 7, message: 'The day trip was a hit, and half the group thanked you.', tip: 'You can enjoy life and still respect your budget.' },
  ] },
  { id: 'medical', emoji: '🏥', title: 'Unexpected medical bill', body: 'A bad fever needs tests and medicine.', options: [
    { key: 'PAY', label: 'Pay the bill', cost: 0.45, happiness: -4, message: 'You recovered. Health first, always.', tip: 'Health insurance protects your savings from big bills.' },
  ] },
  { id: 'bonus', emoji: '🎉', title: 'Surprise bonus!', body: 'Your hard work paid off.', options: [
    { key: 'TAKE', label: 'Collect bonus', cost: -0.5, happiness: 6, message: 'Bonus credited. Treat yourself a little, save the rest.', tip: 'Windfalls are a great chance to boost savings.' },
  ] },
  { id: 'gig', emoji: '💻', title: 'Weekend freelance gig', body: 'Design a poster for a local café.', options: [
    { key: 'TAKE', label: 'Collect payment', cost: -0.25, happiness: 2, message: 'Side income earned!', tip: 'A second income stream makes your budget sturdier.' },
  ] },
  { id: 'rent', emoji: '🏠', title: 'Rent goes up', body: 'Your landlord raises rent by 5% of your income.', options: [
    { key: 'ACCEPT', label: 'Accept the new rent', cost: 0, happiness: -3, message: 'Your fixed needs just grew. Your budget must adapt.', tip: 'Fixed costs creep up. Review your budget every few months.' },
  ] },
];

export interface LifeSimState extends BaseState {
  totalTurns: number;
  month: number;
  months: number;
  income: number;
  needsPct: number;
  savings: number;
  savingsGoal: number;
  loan: number;
  loansTaken: number;
  happiness: number;
  happinessSum: number;
  schedule: (string | null)[];
  pending: { id: string; emoji: string; title: string; body: string; options: { key: string; label: string; hint?: string }[] } | null;
  history: { month: number; savings: number; happiness: number; loan: number }[];
  lastPlan: string | null;
  mission: boolean;
}

export class LifeSimulatorEngine extends BaseGameEngine<LifeSimState> {
  readonly slug = 'life-simulator';

  init(config: unknown, user: EngineUser, seed: number): LifeSimState {
    const c = (config ?? {}) as { months?: number; income?: number; savingsGoal?: number; mission?: boolean };
    const months = clamp(Math.round(c.months ?? 12), 1, 24);
    const base = this.baseState(seed);
    const rng = new SeededRandom(seed);
    // Pre-roll which months bring an event so the run is replayable and progress is known.
    const schedule: (string | null)[] = [];
    for (let m = 1; m <= months; m++) {
      const chance = user.familiarity === 'BEGINNER' ? 0.55 : 0.7;
      schedule.push(m > 1 && rng.next() < chance ? rng.pick(EVENTS).id : null);
    }
    const decisions = schedule.filter((id) => id && EVENTS.find((e) => e.id === id)!.options.length > 1).length;
    const autos = schedule.filter((id) => id && EVENTS.find((e) => e.id === id)!.options.length === 1).length;
    return {
      ...base,
      rngState: rng.state,
      totalTurns: months + decisions + autos,
      month: 1,
      months,
      income: Math.round(c.income ?? 2500000),
      needsPct: 55,
      savings: 0,
      savingsGoal: Math.round(c.savingsGoal ?? 1500000),
      loan: 0,
      loansTaken: 0,
      happiness: 70,
      happinessSum: 0,
      schedule,
      pending: this.eventFor(schedule[0]),
      history: [],
      lastPlan: null,
      mission: Boolean(c.mission),
    };
  }

  private eventFor(id: string | null | undefined): LifeSimState['pending'] {
    if (!id) return null;
    const e = EVENTS.find((x) => x.id === id)!;
    return { id: e.id, emoji: e.emoji, title: e.title, body: e.body, options: e.options.map(({ key, label, hint }) => ({ key, label, hint })) };
  }

  getAvailableActions(state: LifeSimState): Action[] {
    if (state.month > state.months) return [];
    if (state.pending) {
      return state.pending.options.map((o) => ({ type: 'DECIDE', payload: { key: o.key }, label: o.label, hint: o.hint }));
    }
    const leftover = 100 - state.needsPct;
    return PLANS.map((p) => {
      const wants = Math.min(p.wantsPct, leftover);
      return { type: 'BUDGET', payload: { plan: p.key }, label: p.label, hint: `${state.needsPct}% needs · ${wants}% wants · ${leftover - wants}% savings — ${p.hint}` };
    });
  }

  isFinished(state: LifeSimState): boolean {
    return state.month > state.months && !state.pending;
  }

  protected step(state: LifeSimState, action: Action, _rng: SeededRandom): GameEvent[] {
    const events: GameEvent[] = [];
    if (action.type === 'DECIDE') {
      const def = EVENTS.find((e) => e.id === state.pending?.id);
      const opt = def?.options.find((o) => o.key === action.payload?.key);
      if (!def || !opt) throw new GameRuleError('INVALID_CHOICE', 'Pick one of the options.');
      const cost = Math.round(opt.cost * state.income);
      if (def.id === 'rent') state.needsPct = Math.min(80, state.needsPct + 5);
      state.happiness = clamp(state.happiness + opt.happiness, 0, 100);
      events.push({ kind: 'CONSEQUENCE', message: `${def.emoji} ${opt.message}` });
      if (cost !== 0) {
        events.push(...this.spend(state, cost));
      }
      if (opt.tip) {
        state.learned.push(opt.tip);
        events.push({ kind: 'TIP', message: opt.tip });
      }
      state.pending = null;
      state.score = this.scoreOf(state);
      return events;
    }

    const plan = PLANS.find((p) => p.key === action.payload?.plan);
    if (!plan) throw new GameRuleError('INVALID_PLAN', 'Choose a budget plan.');
    const leftover = 100 - state.needsPct;
    const wantsPct = Math.min(plan.wantsPct, leftover);
    const savePct = leftover - wantsPct;
    let toSave = Math.round((state.income * savePct) / 100);

    // Loans charge 3% a month and are repaid first from savings contributions.
    if (state.loan > 0) {
      state.loan = Math.round(state.loan * 1.03);
      const repay = Math.min(state.loan, toSave);
      state.loan -= repay;
      toSave -= repay;
      events.push({ kind: 'WALLET', message: `Paid ₹${Math.round(repay / 100).toLocaleString('en-IN')} towards your loan (3% monthly interest!)`, delta: -repay });
    }
    state.savings += toSave;
    // Small monthly drift: a balanced month holds steady, a tight one wears you down.
    const mood = Math.round((wantsPct - 18) * 0.6) - 2;
    state.happiness = clamp(state.happiness + mood, 0, 100);
    events.push({ kind: 'WALLET', message: `Month ${state.month}: saved ₹${Math.round(toSave / 100).toLocaleString('en-IN')}`, delta: toSave });
    events.push({ kind: 'CONSEQUENCE', message: mood >= 0 ? `Happiness ${mood > 0 ? `+${mood}` : 'steady'} — you enjoyed the month.` : `Happiness ${mood} — tight months wear you down.` });

    if (state.happiness < 25) {
      const splurge = Math.round(state.income * 0.25);
      events.push({ kind: 'CONSEQUENCE', message: '😫 Burnout! You stress-shopped online at midnight.' });
      events.push(...this.spend(state, splurge));
      state.happiness = clamp(state.happiness + 15, 0, 100);
      const tip = 'Budgets that cut every want often break. Leave room for small joys.';
      state.learned.push(tip);
      events.push({ kind: 'TIP', message: tip });
    }

    if (plan.key === 'BALANCED' && !state.learned.includes('The 50/30/20 rule: needs, wants, savings.')) {
      state.learned.push('The 50/30/20 rule: needs, wants, savings.');
    }

    state.happinessSum += state.happiness;
    state.history.push({ month: state.month, savings: state.savings, happiness: state.happiness, loan: state.loan });
    state.lastPlan = plan.key;
    state.month += 1;
    state.pending = state.month <= state.months ? this.eventFor(state.schedule[state.month - 1]) : null;
    state.score = this.scoreOf(state);
    events.push({ kind: 'SCORE', message: `Score ${state.score}`, delta: state.score });
    return events;
  }

  /** Pays from savings first; any shortfall becomes an expensive loan. Negative cost = income. */
  private spend(state: LifeSimState, cost: number): GameEvent[] {
    if (cost < 0) {
      state.savings += -cost;
      return [{ kind: 'WALLET', message: `+₹${Math.round(-cost / 100).toLocaleString('en-IN')} added to savings`, delta: -cost }];
    }
    const fromSavings = Math.min(state.savings, cost);
    state.savings -= fromSavings;
    const shortfall = cost - fromSavings;
    const out: GameEvent[] = [{ kind: 'WALLET', message: `−₹${Math.round(cost / 100).toLocaleString('en-IN')} spent`, delta: -cost }];
    if (shortfall > 0) {
      state.loan += shortfall;
      state.loansTaken += 1;
      out.push({ kind: 'CONSEQUENCE', message: `💸 Not enough savings — you borrowed ₹${Math.round(shortfall / 100).toLocaleString('en-IN')} at high interest.`, delta: -shortfall });
      const tip = 'An emergency fund of 3–6 months of expenses keeps you out of debt.';
      if (!state.learned.includes(tip)) state.learned.push(tip);
    }
    return out;
  }

  private scoreOf(state: LifeSimState): number {
    const monthsPlayed = Math.max(1, state.history.length);
    const net = state.savings - state.loan;
    const goalScore = state.savingsGoal > 0 ? clamp(net / state.savingsGoal, 0, 1.5) * 400 : net >= 0 ? 400 : 0;
    const avgHappiness = state.happinessSum / monthsPlayed;
    const happyScore = (avgHappiness / 100) * 250;
    const debtScore = state.loansTaken === 0 ? 150 : Math.max(0, 150 - state.loansTaken * 60);
    const progress = Math.min(1, state.history.length / state.months);
    const total = Math.round(clamp((goalScore + happyScore + debtScore) * progress, 0, 1000));
    return Number.isFinite(total) ? total : 0;
  }

  /** Future months' events stay server-side. */
  publicState(state: LifeSimState): GameState {
    const { schedule: _schedule, ...rest } = super.publicState(state) as LifeSimState;
    return rest;
  }

  computeResult(state: LifeSimState): GameResult {
    const finalScore = this.scoreOf(state);
    const net = state.savings - state.loan;
    const goalReached = state.month > state.months && net >= state.savingsGoal && state.loan === 0;
    return {
      finalScore,
      performance: clamp(finalScore / 1000, 0, 1) || 0,
      goalReached,
      learnings: this.summarizeLearnings(state, [
        'The 50/30/20 rule: needs, wants, savings.',
        'An emergency fund of 3–6 months of expenses keeps you out of debt.',
        'Separate needs from wants before you spend.',
      ]),
      stats: {
        monthsPlayed: state.history.length,
        savings: Math.round(state.savings / 100),
        loan: Math.round(state.loan / 100),
        loansTaken: state.loansTaken,
        happiness: Math.round(state.happiness),
      },
    };
  }
}

export const lifeSimulatorEngine = new LifeSimulatorEngine();
