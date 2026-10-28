import { SeededRandom } from './seeded-random';

/**
 * Number templates for bank questions: one row in `questions` with a `template` key and `params`
 * becomes a fresh variant per session (different numbers, different right answer).
 *
 * Params: { "P": { "min": 5000, "max": 50000, "step": 1000 }, "r": { "choices": [6, 8, 10] } }
 * Placeholders in prompt/explanation: {P:inr} → ₹12,000, {r} → 8, {answer} → the formatted right answer,
 * plus any derived values a template returns (e.g. {interest:inr}).
 */

export type ParamSpec = { min: number; max: number; step?: number } | { choices: number[] };
type Unit = 'inr' | 'years' | 'pct';

interface TemplateOutput {
  answer: number;
  /** Plausible wrong answers, usually from a common mistake. Duplicates are replaced automatically. */
  distractors: number[];
  unit: Unit;
  derived?: Record<string, number>;
}

const pct = (n: number) => n / 100;

const TEMPLATES: Record<string, (v: Record<string, number>) => TemplateOutput> = {
  // Interest only, not the total.
  simple_interest: ({ P, r, n }) => ({
    answer: (P * r * n) / 100,
    distractors: [P * (1 + pct(r)) ** n - P, (P * r) / 100, P + (P * r * n) / 100],
    unit: 'inr',
  }),
  compound_amount: ({ P, r, n }) => ({
    answer: P * (1 + pct(r)) ** n,
    distractors: [P * (1 + pct(r) * n), P * (1 + pct(r)), P * (1 + pct(r)) ** n * 1.3],
    unit: 'inr',
  }),
  discount_price: ({ price, off }) => ({
    answer: price * (1 - pct(off)),
    distractors: [price * pct(off), price - off, price * (1 - pct(off) / 2)],
    unit: 'inr',
  }),
  stacked_discount: ({ price, a, b }) => ({
    answer: price * (1 - pct(a)) * (1 - pct(b)),
    distractors: [price * (1 - pct(a + b)), price * (1 - pct(a)), price * (1 - pct(b))],
    unit: 'inr',
  }),
  rule_of_72: ({ r }) => ({
    answer: 72 / r,
    distractors: [100 / r, 36 / r, r],
    unit: 'years',
  }),
  inflation_price: ({ price, r, n }) => ({
    answer: price * (1 + pct(r)) ** n,
    distractors: [price * (1 + pct(r)), price * (1 - pct(r)) ** n, price * (1 + pct(r)) ** n * 1.4],
    unit: 'inr',
  }),
  yearly_habit: ({ amount, days }) => ({
    answer: amount * days * 12,
    distractors: [amount * days, amount * 52, amount * days * 24],
    unit: 'inr',
  }),
  budget_share: ({ income, share }) => ({
    answer: (income * share) / 100,
    distractors: [50, 30, 20, 10].filter((s) => s !== share).map((s) => (income * s) / 100),
    unit: 'inr',
  }),
  emi_total: ({ emi, months, fee }) => ({
    answer: emi * months + fee,
    distractors: [emi * months, emi * months - fee, emi * (months + 1) + fee],
    unit: 'inr',
  }),
  emergency_fund: ({ expenses, months }) => ({
    answer: expenses * months,
    distractors: [(expenses * months) / 2, expenses * 12, expenses * (months + 3)],
    unit: 'inr',
  }),
  goal_saving: ({ target, months }) => ({
    answer: target / months,
    distractors: [target / (months * 2), (target * 2) / months, target / 12],
    unit: 'inr',
  }),
  sip_invested: ({ amount, years }) => ({
    answer: amount * 12 * years,
    distractors: [amount * years, amount * 12, amount * 12 * years * 2],
    unit: 'inr',
  }),
  real_return: ({ rate, inflation }) => ({
    answer: rate - inflation,
    distractors: [rate + inflation, rate, inflation],
    unit: 'pct',
  }),
  // Monthly interest on an unpaid credit card balance at an annual rate.
  card_interest: ({ balance, apr }) => ({
    answer: (balance * apr) / 1200,
    distractors: [(balance * apr) / 100, (balance * apr) / 2400, (balance * apr) / 600],
    unit: 'inr',
  }),
  // Share of your credit limit in use.
  utilisation: ({ limit, used }) => ({
    answer: (used / limit) * 100,
    distractors: [(limit / used) * 10, ((limit - used) / limit) * 100, (used / limit) * 50],
    unit: 'pct',
  }),
  // Value of a lump sum after inflation erodes it (today's purchasing power).
  purchasing_power: ({ amount, r, n }) => ({
    answer: amount / (1 + pct(r)) ** n,
    distractors: [amount, amount * (1 + pct(r)) ** n, amount * (1 - pct(r))],
    unit: 'inr',
  }),
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATES);

const inr = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(Math.round(n))}`;
const num = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(n);

function formatValue(n: number, unit: Unit): string {
  if (unit === 'inr') return inr(n);
  if (unit === 'years') return `${num(n)} years`;
  return `${num(n)}%`;
}

function resolveParams(params: Record<string, ParamSpec>, rng: SeededRandom): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, spec] of Object.entries(params)) {
    if ('choices' in spec) out[k] = rng.pick(spec.choices);
    else {
      const step = spec.step ?? 1;
      out[k] = spec.min + step * rng.int(0, Math.floor((spec.max - spec.min) / step));
    }
  }
  return out;
}

function fill(text: string, vars: Record<string, number>, answer: string): string {
  return text.replace(/\{(\w+)(?::(inr|pct|years))?\}/g, (whole, key: string, fmt?: Unit) => {
    if (key === 'answer') return answer;
    if (!(key in vars)) return whole;
    return fmt ? formatValue(vars[key], fmt) : num(vars[key]);
  });
}

export interface RenderedQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** Turns a template row into a concrete question. Same (row, seed) always gives the same numbers. */
export function renderTemplate(
  row: { template: string; params: Record<string, ParamSpec>; prompt: string; explanation: string },
  rng: SeededRandom,
): RenderedQuestion {
  const tpl = TEMPLATES[row.template];
  if (!tpl) throw new Error(`Unknown question template: ${row.template}`);
  const vars = resolveParams(row.params, rng);
  const out = tpl(vars);
  const allVars = { ...vars, ...out.derived };
  const answer = formatValue(out.answer, out.unit);

  // Keep only distractors that read differently from the answer and from each other.
  const options = [answer];
  for (const d of out.distractors) {
    const label = formatValue(d, out.unit);
    // Rupee amounts must be positive; percentages may go negative (e.g. a negative real return).
    if ((d > 0 || out.unit !== 'inr') && options.length < 4 && !options.includes(label)) options.push(label);
  }
  // Still short (e.g. distractors collided): step away from the answer, by 25% or by 1 when the answer is small.
  const stepSize = Math.abs(out.answer) >= 10 ? Math.abs(out.answer) * 0.25 : 1;
  for (let k = 1; options.length < 4 && k < 12; k++) {
    const v = out.answer + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * stepSize;
    const label = formatValue(v, out.unit);
    if ((v > 0 || out.unit !== 'inr') && !options.includes(label)) options.push(label);
  }
  return { prompt: fill(row.prompt, allVars, answer), options, correctIndex: 0, explanation: fill(row.explanation, allVars, answer) };
}
