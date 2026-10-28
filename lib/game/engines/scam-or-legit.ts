import { BaseGameEngine, clamp, type BaseState } from '../base-engine';
import { SeededRandom } from '../seeded-random';
import { GameRuleError, type Action, type EngineUser, type GameEvent, type GameResult, type GameState } from '../types';

export interface ScamMessage {
  id: string;
  channel: 'SMS' | 'WhatsApp' | 'Email' | 'Call' | 'App';
  sender: string;
  body: string;
  isScam: boolean;
  redFlags: string[];
  explanation: string;
}

// Built-in fallback for when the question bank is unavailable.
// All brands are fictional. Messages mirror common Indian fraud patterns and genuine notices.
const MESSAGES: ScamMessage[] = [
  { id: 'kyc-link', channel: 'SMS', sender: 'VM-BHRTBK', body: 'Dear customer, your Bharat Bank account will be BLOCKED today. Update KYC now: bharat-bank-kyc.co/update', isScam: true, redFlags: ['Urgent threat of blocking', 'Lookalike link, not the bank’s domain', 'Banks don’t do KYC by SMS link'], explanation: 'Banks never ask you to update KYC through a random link. Visit the branch or the official app.' },
  { id: 'otp-call', channel: 'Call', sender: '+91 98XXX 21034', body: '“Sir, I am calling from your bank’s fraud department. Please tell me the OTP you just received so we can cancel the suspicious transaction.”', isScam: true, redFlags: ['Asks for OTP', 'Unknown mobile number', 'Creates panic'], explanation: 'Nobody genuine will ever ask for your OTP. Hang up.' },
  { id: 'collect', channel: 'App', sender: 'UPI collect request', body: 'Rahul_OLX has requested ₹4,999. Enter UPI PIN to RECEIVE payment for your sofa.', isScam: true, redFlags: ['“Enter PIN to receive” is impossible', 'Collect request from a stranger'], explanation: 'Entering your UPI PIN always sends money. You never need it to receive.' },
  { id: 'lottery', channel: 'WhatsApp', sender: '+44 7700 900123', body: 'Congratulations!! Your number won ₹25,00,000 in the KBC Lucky Draw. Pay ₹8,500 processing fee to claim. 🎉', isScam: true, redFlags: ['You never entered a lottery', 'Pay a fee to receive money', 'Foreign number'], explanation: 'If you have to pay to receive a prize, there is no prize.' },
  { id: 'job-fee', channel: 'WhatsApp', sender: 'HR Priya (TalentHub)', body: 'Work from home, earn ₹3,000/day liking YouTube videos! Pay ₹999 joining fee to start today.', isScam: true, redFlags: ['Too-good-to-be-true pay', 'Joining fee', 'Task-based “liking” jobs'], explanation: 'Real jobs pay you; they never charge you to join. “Like and earn” tasks are a common trap.' },
  { id: 'crypto', channel: 'WhatsApp', sender: 'Crypto Kings VIP 💎', body: 'Join our premium signals group. Guaranteed 300% returns in 30 days! Only 5 seats left.', isScam: true, redFlags: ['“Guaranteed” returns', 'Absurd 300% in a month', 'Fake scarcity'], explanation: 'No legitimate investment guarantees returns, let alone 300% a month.' },
  { id: 'electricity', channel: 'SMS', sender: '+91 70XXX 88412', body: 'Your electricity will be disconnected tonight at 9:30 PM as last month bill not updated. Call officer 70XXX88412 immediately.', isScam: true, redFlags: ['Personal mobile number', 'Tonight deadline', 'Poor grammar'], explanation: 'Electricity boards send notices from official IDs and never threaten same-night cuts by SMS.' },
  { id: 'parcel', channel: 'SMS', sender: 'IndPost-Help', body: 'Your parcel is held due to incomplete address. Pay ₹25 redelivery fee: indpost-redeliver.in', isScam: true, redFlags: ['Unexpected parcel', 'Small fee to steal card details', 'Fake domain'], explanation: 'A tiny “fee” is bait to capture your card details.' },
  { id: 'screen-share', channel: 'Call', sender: 'Customer Care (from Google search)', body: '“To process your refund, please install AnyDesk and share the 9-digit code.”', isScam: true, redFlags: ['Asks to install screen-sharing app', 'Number found via random search result'], explanation: 'Screen-sharing apps give fraudsters full control of your phone. Use only official helplines from the company’s app.' },
  { id: 'relative', channel: 'WhatsApp', sender: 'Unknown number', body: 'Hi beta, this is Mamaji’s new number. Urgent hospital emergency, please send ₹15,000 on this UPI, will return tomorrow.', isScam: true, redFlags: ['New number claiming to be family', 'Urgent money request', 'Asks not to call'], explanation: 'Call the relative on their old number before sending anything.' },
  { id: 'refund-tax', channel: 'Email', sender: 'refunds@incometax-gov-refund.com', body: 'You are eligible for an income tax refund of ₹18,240. Submit your card details within 24 hours to receive it.', isScam: true, redFlags: ['Not a .gov.in domain', 'Asks for card details', '24-hour pressure'], explanation: 'Tax refunds go straight to your bank account. The department never asks for card details.' },
  { id: 'debit-alert', channel: 'SMS', sender: 'AX-BHRTBK', body: 'Rs.450.00 debited from A/c XX2241 on 12-Oct at SWIGGY via UPI. Not you? Call 1800-XXX-1234 (number on your card).', isScam: false, redFlags: [], explanation: 'A normal transaction alert: no link, no request, and it tells you to use the number on your card.' },
  { id: 'sip-confirm', channel: 'Email', sender: 'noreply@growvest.in', body: 'Your monthly SIP of ₹2,000 in Flexicap Mutual Fund was processed successfully. Units allotted: 33.21. View in the Growvest app.', isScam: false, redFlags: [], explanation: 'An information-only confirmation from the platform you already use. It asks you to do nothing risky.' },
  { id: 'otp-self', channel: 'SMS', sender: 'VK-PAYEZY', body: '482911 is your OTP to log in to PayEzy. Do NOT share this with anyone, including PayEzy staff.', isScam: false, redFlags: [], explanation: 'A genuine OTP you requested, with the right warning. Just don’t share it.' },
  { id: 'broker-notice', channel: 'Email', sender: 'updates@tradelane.in', body: 'Quarterly settlement: as per exchange rules, unused funds of ₹1,250 in your TradeLane account have been returned to your linked bank account.', isScam: false, redFlags: [], explanation: 'Brokers really do return idle funds every quarter by rule. No action needed.' },
  { id: 'salary', channel: 'SMS', sender: 'JM-BHRTBK', body: 'Your A/c XX2241 is credited with Rs.28,500.00 on 01-Nov by NEFT from ACME SOFTWARE PVT LTD (Salary).', isScam: false, redFlags: [], explanation: 'A plain credit alert from the bank’s sender ID. Nothing to click, nothing to share.' },
  { id: 'emi-reminder', channel: 'App', sender: 'Bharat Bank app', body: 'Reminder: your EMI of ₹3,200 is due on 5 Nov. Keep balance in your account to avoid late fees.', isScam: false, redFlags: [], explanation: 'A routine in-app reminder about a loan you know you have.' },
  { id: 'upi-received', channel: 'App', sender: 'UPI app', body: 'You received ₹500 from Ananya S. for “movie tickets”. Balance updated.', isScam: false, redFlags: [], explanation: 'Money received shows up without any PIN. This is exactly how it should look.' },
  { id: 'insurance-renew', channel: 'Email', sender: 'renewals@surakshainsure.co.in', body: 'Your health policy renews on 20 Nov. Renew from the Suraksha app or website you used to buy it. Ignore if already paid.', isScam: false, redFlags: [], explanation: 'It points you to the official app/site you already use, with no link pressure.' },
  { id: 'refund-genuine', channel: 'SMS', sender: 'AD-SHOPKR', body: 'Refund of ₹1,299 for order #SK8812 initiated to your original payment method. It will reflect in 5–7 working days.', isScam: false, redFlags: [], explanation: 'Real refunds go back to the original payment method automatically — no details needed.' },
];

export interface ScamState extends BaseState {
  totalTurns: number;
  deck: string[];
  /** Private: the drawn messages, with answers, when they came from the question bank (stripped by publicState). */
  messages?: ScamMessage[];
  /** Private: right/wrong per answered message, in deck order. */
  marks?: boolean[];
  index: number;
  correct: number;
  scamsMissed: number;
  falseAlarms: number;
  scamsTotal: number;
  current: Pick<ScamMessage, 'id' | 'channel' | 'sender' | 'body'> | null;
  lastReveal: { id: string; call: 'SCAM' | 'LEGIT'; isScam: boolean; correct: boolean; redFlags: string[]; explanation: string; message: Pick<ScamMessage, 'channel' | 'sender' | 'body'> } | null;
}

/** Client-facing ids are per-session slots (`msg-<n>`), never content ids. */
const messageAt = (state: Pick<ScamState, 'deck' | 'messages'>, index: number) =>
  state.messages ? state.messages[index] : MESSAGES.find((m) => m.id === state.deck[index]);

const pub = (m: ScamMessage, index: number) => ({ id: `msg-${index + 1}`, channel: m.channel, sender: m.sender, body: m.body });

export class ScamOrLegitEngine extends BaseGameEngine<ScamState> {
  readonly slug = 'scam-or-legit';

  init(config: unknown, _user: EngineUser, seed: number): ScamState {
    const c = (config ?? {}) as { cards?: number; questions?: ScamMessage[] };
    const fromBank = Array.isArray(c.questions) && c.questions.length > 0;
    const pool = fromBank ? c.questions! : MESSAGES;
    const count = clamp(Math.round(c.cards ?? 12), 1, pool.length);
    const rng = new SeededRandom(seed);
    // Keep the mix roughly 60/40 scam/legit so both calls matter (the bank already draws in that ratio).
    const scams = rng.shuffle(pool.filter((m) => m.isScam));
    const legit = rng.shuffle(pool.filter((m) => !m.isScam));
    const nScam = Math.min(scams.length, Math.round(count * 0.6));
    const picked = rng.shuffle([...scams.slice(0, nScam), ...legit.slice(0, count - nScam)]);
    const deck = picked.map((m) => m.id);
    return {
      ...this.baseState(seed),
      rngState: rng.state,
      totalTurns: deck.length,
      deck,
      ...(fromBank ? { messages: picked } : {}),
      marks: [],
      index: 0,
      correct: 0,
      scamsMissed: 0,
      falseAlarms: 0,
      scamsTotal: picked.filter((m) => m.isScam).length,
      current: pub(picked[0], 0),
      lastReveal: null,
    };
  }

  getAvailableActions(state: ScamState): Action[] {
    if (!state.current) return [];
    return [
      { type: 'SCAM', label: '🚩 Scam', hint: '←' },
      { type: 'LEGIT', label: '✅ Legit', hint: '→' },
    ];
  }

  isFinished(state: ScamState): boolean {
    return state.index >= state.deck.length;
  }

  protected step(state: ScamState, action: Action): GameEvent[] {
    const msg = messageAt(state, state.index);
    if (!msg) throw new GameRuleError('NO_MESSAGE', 'No message to judge.');
    const call = action.type as 'SCAM' | 'LEGIT';
    const slot = `msg-${state.index + 1}`;
    const right = (call === 'SCAM') === msg.isScam;
    const events: GameEvent[] = [];
    if (right) {
      state.correct += 1;
      state.score = Math.min(1000, state.score + 80);
      events.push({ kind: 'SCORE', message: msg.isScam ? '🛡️ Scam blocked!' : '👍 Correct, that one was genuine.', delta: 80 });
    } else if (msg.isScam) {
      state.scamsMissed += 1;
      state.score = Math.max(0, state.score - 40);
      events.push({ kind: 'CONSEQUENCE', message: '💸 You fell for a scam! That would have cost real money.', delta: -40 });
    } else {
      state.falseAlarms += 1;
      state.score = Math.max(0, state.score - 20);
      events.push({ kind: 'CONSEQUENCE', message: 'That one was actually genuine. Caution is good — but check the details.', delta: -20 });
    }
    events.push({ kind: 'TIP', message: msg.explanation });
    if (msg.isScam && !right && !state.learned.includes(msg.explanation)) state.learned.push(msg.explanation);
    (state.marks ??= []).push(right);
    state.lastReveal = { id: slot, call, isScam: msg.isScam, correct: right, redFlags: msg.redFlags, explanation: msg.explanation, message: { channel: msg.channel, sender: msg.sender, body: msg.body } };
    state.index += 1;
    const next = messageAt(state, state.index);
    state.current = next ? pub(next, state.index) : null;
    if (!state.current && state.scamsMissed === 0 && state.falseAlarms <= 1) state.score = Math.min(1000, state.score + 40);
    return events;
  }

  publicState(state: ScamState): GameState {
    const { messages: _messages, marks: _marks, ...rest } = super.publicState(state) as ScamState;
    return { ...rest, deck: state.deck.map(() => '') };
  }

  answeredQuestions(state: ScamState) {
    const messages = state.messages;
    if (!messages) return [];
    return (state.marks ?? []).map((correct, i) => ({ questionId: messages[i].id, correct }));
  }

  computeResult(state: ScamState): GameResult {
    const total = Math.max(1, state.deck.length);
    const answered = state.index;
    // Unanswered scams in a force-ended game count as missed.
    const remainingScams = state.deck.slice(answered).filter((_, i) => messageAt(state, answered + i)?.isScam).length;
    return {
      finalScore: state.score,
      performance: clamp(state.score / (total * 80 + 40), 0, 1) || 0,
      goalReached: answered === state.deck.length && state.scamsMissed === 0 && state.falseAlarms <= 1,
      learnings: this.summarizeLearnings(state, [
        'Never share an OTP or UPI PIN — not even with “bank staff”.',
        'Collect requests take money from you; you never need a PIN to receive.',
        'Guaranteed high returns and urgent deadlines are classic red flags.',
      ]),
      stats: { correct: state.correct, total, scamsMissed: state.scamsMissed + remainingScams, falseAlarms: state.falseAlarms },
    };
  }
}

export const scamOrLegitEngine = new ScamOrLegitEngine();
