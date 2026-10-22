import { BaseGameEngine, clamp, type BaseState } from '../base-engine';
import { SeededRandom } from '../seeded-random';
import { GameRuleError, type Action, type EngineUser, type GameEvent, type GameResult, type GameState } from '../types';

interface ChallengeCard {
  id: string;
  topic: 'Discounts' | 'EMI' | 'Inflation' | 'Scams' | 'UPI safety' | 'Compound interest' | 'Budgeting' | 'Credit';
  emoji: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const CARDS: ChallengeCard[] = [
  { id: 'disc-1', topic: 'Discounts', emoji: '🏷️', prompt: 'A ₹2,000 jacket is “40% off”. Another shop sells the same jacket for ₹1,300. Which is cheaper?', options: ['The 40% off jacket (₹1,200)', 'The ₹1,300 jacket', 'They cost the same'], correctIndex: 0, explanation: '40% of ₹2,000 is ₹800, so the sale price is ₹1,200 — cheaper than ₹1,300. Always do the maths instead of trusting the loudest sign.' },
  { id: 'disc-2', topic: 'Discounts', emoji: '🛒', prompt: '“Buy 2, get 1 free” on ₹300 shampoo. You only need one bottle. What’s the smart move?', options: ['Buy 3 — free is free!', 'Buy just 1 bottle', 'Buy 2 to be safe'], correctIndex: 1, explanation: 'A deal only saves money if you needed the extra items. Otherwise you spent ₹600 instead of ₹300.' },
  { id: 'disc-3', topic: 'Discounts', emoji: '⏰', prompt: 'An app shows “Only 2 left! Offer ends in 5:00”. What is this most likely?', options: ['A genuine last chance', 'A pressure tactic to rush you', 'A bug in the app'], correctIndex: 1, explanation: 'Countdown timers and “only X left” create urgency so you skip thinking. Wait and compare.' },
  { id: 'emi-1', topic: 'EMI', emoji: '📱', prompt: 'A ₹60,000 phone on “No-cost EMI” of ₹5,000 × 12 months, but there’s a ₹1,999 processing fee. Is it really no-cost?', options: ['Yes, it’s exactly ₹60,000', 'No, you pay ₹61,999 total', 'You pay less than ₹60,000'], correctIndex: 1, explanation: 'Fees and lost discounts hide inside “no-cost” EMIs. Add up the total you’ll actually pay.' },
  { id: 'emi-2', topic: 'EMI', emoji: '🧾', prompt: 'Your take-home pay is ₹30,000. Experts suggest total EMIs stay below roughly…', options: ['₹25,000', '₹12,000 (about 40%)', 'Any amount, as long as you pay on time'], correctIndex: 1, explanation: 'Keep EMIs under ~30–40% of income so emergencies don’t push you into missed payments.' },
  { id: 'inf-1', topic: 'Inflation', emoji: '📉', prompt: 'Your savings account pays 3% a year and inflation is 6%. After a year, your money can buy…', options: ['More than before', 'The same as before', 'Less than before'], correctIndex: 2, explanation: 'If prices rise faster than your interest, your purchasing power shrinks.' },
  { id: 'inf-2', topic: 'Inflation', emoji: '🍛', prompt: 'A thali cost ₹100 ten years ago. With ~6% inflation a year, what does it cost now, roughly?', options: ['₹106', '₹160', '₹180'], correctIndex: 2, explanation: '6% compounding for 10 years ≈ 1.79×, so about ₹180. Inflation compounds too!' },
  { id: 'scam-1', topic: 'Scams', emoji: '🎰', prompt: 'A WhatsApp group promises “guaranteed 5% daily returns” on crypto. What do you do?', options: ['Invest a small amount to test', 'Leave the group and report it', 'Share it with friends'], correctIndex: 1, explanation: 'No real investment guarantees high returns. “Guaranteed” plus “daily” is a classic Ponzi sign.' },
  { id: 'scam-2', topic: 'Scams', emoji: '💼', prompt: 'A “job offer” asks you to pay ₹2,500 as a registration fee before the interview.', options: ['Pay it, jobs are hard to find', 'Refuse — real employers don’t charge fees', 'Negotiate the fee down'], correctIndex: 1, explanation: 'Genuine companies never ask candidates to pay for a job or interview.' },
  { id: 'upi-1', topic: 'UPI safety', emoji: '📲', prompt: 'You’re selling a cycle online. The buyer sends a UPI “collect request” saying you’ll receive ₹4,000 if you enter your PIN.', options: ['Enter PIN to receive money', 'Decline — entering a PIN always sends money', 'Ask them to send it twice'], correctIndex: 1, explanation: 'You never need a UPI PIN to receive money. Entering it means you are paying.' },
  { id: 'upi-2', topic: 'UPI safety', emoji: '🔢', prompt: 'Someone claiming to be from your bank asks for the OTP to “stop a fraudulent transaction”.', options: ['Share it quickly to stop the fraud', 'Never share it and call the bank’s official number', 'Share half of it'], correctIndex: 1, explanation: 'Banks never ask for OTPs. Anyone who does is the fraudster.' },
  { id: 'upi-3', topic: 'UPI safety', emoji: '🧾', prompt: 'A QR code is stuck over the shop’s original one. What’s the risk?', options: ['None, QR codes are safe', 'Money may go to a fraudster’s account', 'The payment will just fail'], correctIndex: 1, explanation: 'Check the name shown on your UPI app before paying. Swapped QR stickers are a known trick.' },
  { id: 'ci-1', topic: 'Compound interest', emoji: '🌱', prompt: 'Asha invests ₹1,000/month from age 20; Ravi invests ₹2,000/month from age 30. At 12% a year, who has more at 60?', options: ['Ravi, he invests double', 'Asha, thanks to 10 extra years of compounding', 'Exactly the same'], correctIndex: 1, explanation: 'Starting early beats investing more later. Time is compounding’s superpower.' },
  { id: 'ci-2', topic: 'Compound interest', emoji: '✌️', prompt: 'Rule of 72: at 8% a year, money doubles in about…', options: ['4 years', '9 years', '20 years'], correctIndex: 1, explanation: '72 ÷ 8 = 9 years. A quick way to estimate doubling time.' },
  { id: 'bud-1', topic: 'Budgeting', emoji: '📊', prompt: 'With the 50/30/20 rule and ₹20,000 income, how much should go to savings?', options: ['₹2,000', '₹4,000', '₹10,000'], correctIndex: 1, explanation: '20% of ₹20,000 = ₹4,000. Pay yourself first, right on payday.' },
  { id: 'bud-2', topic: 'Budgeting', emoji: '☕', prompt: 'A ₹150 coffee every working day (22 days) costs you how much a year?', options: ['About ₹4,000', 'About ₹15,000', 'About ₹40,000'], correctIndex: 2, explanation: '₹150 × 22 × 12 ≈ ₹39,600. Small daily spends add up big.' },
  { id: 'cred-1', topic: 'Credit', emoji: '💳', prompt: 'You pay only the “minimum due” on your credit card each month. What happens?', options: ['Nothing, you’re fine', 'The rest grows at ~36–42% a year interest', 'The bank forgives the rest'], correctIndex: 1, explanation: 'Credit card interest is among the most expensive debt. Pay the full bill every month.' },
  { id: 'cred-2', topic: 'Credit', emoji: '📈', prompt: 'Which habit helps your credit score most?', options: ['Applying for many cards', 'Paying every bill on time', 'Never using credit at all'], correctIndex: 1, explanation: 'On-time payments are the biggest factor in a good credit score.' },
];


export interface ChallengeState extends BaseState {
  totalTurns: number;
  /** Private: content ids in play order (blanked by publicState). */
  deck: string[];
  /** Private: per-card option order, perms[i][shown] = original option index (stripped by publicState). */
  perms: number[][];
  index: number;
  correct: number;
  streak: number;
  bestStreak: number;
  /** Ids exposed to the client are per-session slots (`card-<n>`), never content ids. */
  current: { id: string; topic: string; emoji: string; prompt: string; options: string[] } | null;
  lastReveal: { id: string; choice: number; correctIndex: number; correct: boolean; explanation: string } | null;
  answers: { id: string; topic: string; correct: boolean }[];
}

const slotId = (index: number) => `card-${index + 1}`;

function publicCard(state: Pick<ChallengeState, 'deck' | 'perms'>, index: number): ChallengeState['current'] {
  const c = CARDS.find((x) => x.id === state.deck[index]);
  if (!c) return null;
  const perm = state.perms[index];
  return { id: slotId(index), topic: c.topic, emoji: c.emoji, prompt: c.prompt, options: perm.map((o) => c.options[o]) };
}

export class MoneyChallengesEngine extends BaseGameEngine<ChallengeState> {
  readonly slug = 'money-challenges';

  init(config: unknown, _user: EngineUser, seed: number): ChallengeState {
    const c = (config ?? {}) as { cards?: number };
    const count = clamp(Math.round(c.cards ?? 10), 1, CARDS.length);
    const rng = new SeededRandom(seed);
    const cards = rng.shuffle(CARDS).slice(0, count);
    const deck = cards.map((x) => x.id);
    // Shuffle each card's options so answer positions can't be memorised.
    const perms = cards.map((x) => rng.shuffle(x.options.map((_, i) => i)));
    return {
      ...this.baseState(seed),
      rngState: rng.state,
      totalTurns: count,
      deck,
      perms,
      index: 0,
      correct: 0,
      streak: 0,
      bestStreak: 0,
      current: publicCard({ deck, perms }, 0),
      lastReveal: null,
      answers: [],
    };
  }

  getAvailableActions(state: ChallengeState): Action[] {
    if (!state.current) return [];
    return state.current.options.map((o, i) => ({ type: 'ANSWER', payload: { choice: i }, label: o }));
  }

  isFinished(state: ChallengeState): boolean {
    return state.index >= state.deck.length;
  }

  protected step(state: ChallengeState, action: Action): GameEvent[] {
    const card = CARDS.find((c) => c.id === state.deck[state.index]);
    if (!card) throw new GameRuleError('NO_CARD', 'No card to answer.');
    const choice = action.payload?.choice;
    if (typeof choice !== 'number' || !Number.isInteger(choice) || choice < 0 || choice >= card.options.length) {
      throw new GameRuleError('INVALID_CHOICE', 'Pick one of the answers.');
    }
    const perm = state.perms[state.index];
    const shownCorrect = perm.indexOf(card.correctIndex);
    const right = choice === shownCorrect;
    const slot = slotId(state.index);
    const events: GameEvent[] = [];
    if (right) {
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const pts = 80 + (state.streak >= 3 ? 20 : 0);
      state.score = Math.min(1000, state.score + pts);
      events.push({ kind: 'SCORE', message: state.streak >= 3 ? `Correct! 🔥 ${state.streak} in a row` : 'Correct!', delta: pts });
    } else {
      state.streak = 0;
      events.push({ kind: 'CONSEQUENCE', message: `Not quite. The answer was “${card.options[card.correctIndex]}”.` });
    }
    events.push({ kind: 'TIP', message: card.explanation });
    if (!right && !state.learned.includes(card.explanation)) state.learned.push(card.explanation);
    state.answers.push({ id: slot, topic: card.topic, correct: right });
    state.lastReveal = { id: slot, choice, correctIndex: shownCorrect, correct: right, explanation: card.explanation };
    state.index += 1;
    state.current = publicCard(state, state.index);
    return events;
  }

  publicState(state: ChallengeState): GameState {
    const { perms: _perms, ...rest } = super.publicState(state) as ChallengeState;
    return { ...rest, deck: state.deck.map(() => '') };
  }

  computeResult(state: ChallengeState): GameResult {
    const total = Math.max(1, state.deck.length);
    return {
      finalScore: state.score,
      performance: clamp(state.correct / total, 0, 1) || 0,
      goalReached: state.correct >= Math.ceil(total * 0.7),
      learnings: this.summarizeLearnings(state, [
        'Do the maths on every “deal”.',
        'You never need a UPI PIN or OTP to receive money.',
        'Inflation quietly shrinks money that isn’t growing.',
      ]),
      stats: { correct: state.correct, total, bestStreak: state.bestStreak },
    };
  }
}

export const moneyChallengesEngine = new MoneyChallengesEngine();
