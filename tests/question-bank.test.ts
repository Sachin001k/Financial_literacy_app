import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { registry } from '@/lib/game/registry';
import { renderTemplate, TEMPLATE_KEYS, type ParamSpec } from '@/lib/game/question-templates';
import { SeededRandom } from '@/lib/game/seeded-random';
import type { ChallengeCard } from '@/lib/game/engines/money-challenges';
import type { ScamMessage } from '@/lib/game/engines/scam-or-legit';

// Pull the two JSON arrays out of the seed migration so the questions players get are checked here.
const sql = readFileSync(join(__dirname, '../supabase/migrations/0005_seed_questions.sql'), 'utf8');
const blocks = Array.from(sql.matchAll(/\$json\$([\s\S]*?)\$json\$/g), (m) => JSON.parse(m[1]));
const challenges = blocks[0] as { slug: string; level: string; prompt: string; options?: string[]; answer?: number; why: string; template?: string; params?: Record<string, ParamSpec> }[];
const scams = blocks[1] as { slug: string; level: string; scam: boolean; body: string; why: string }[];
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const user = { id: 'u1', familiarity: 'BEGINNER' as const };

describe('question bank seed', () => {
  it('has unique slugs and valid levels', () => {
    const slugs = [...challenges, ...scams].map((q) => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const q of [...challenges, ...scams]) expect(LEVELS).toContain(q.level);
  });

  it('has enough questions per level to fill a game from that level alone', () => {
    for (const level of LEVELS) {
      expect(challenges.filter((q) => q.level === level).length).toBeGreaterThanOrEqual(30);
      // Scam or Legit draws 7 scams + 5 genuine per game.
      expect(scams.filter((q) => q.level === level && q.scam).length).toBeGreaterThanOrEqual(7);
      expect(scams.filter((q) => q.level === level && !q.scam).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('static questions point at a real option', () => {
    for (const q of challenges.filter((c) => !c.template)) {
      expect(q.options!.length, q.slug).toBeGreaterThanOrEqual(2);
      expect(q.answer!, q.slug).toBeGreaterThanOrEqual(0);
      expect(q.answer!, q.slug).toBeLessThan(q.options!.length);
      expect(new Set(q.options).size, q.slug).toBe(q.options!.length);
    }
  });

  it('templates render with every placeholder filled and four distinct options', () => {
    for (const q of challenges.filter((c) => c.template)) {
      expect(TEMPLATE_KEYS, q.slug).toContain(q.template);
      for (let seed = 1; seed <= 200; seed++) {
        const r = renderTemplate({ template: q.template!, params: q.params!, prompt: q.prompt, explanation: q.why }, new SeededRandom(seed));
        expect(r.prompt + r.explanation, q.slug).not.toMatch(/\{\w+(:\w+)?\}/);
        expect(r.options.length, q.slug).toBe(4);
        expect(new Set(r.options).size, q.slug).toBe(4);
        expect(r.options[r.correctIndex], q.slug).not.toMatch(/NaN|Infinity/);
      }
    }
  });

  it('the same template and seed always give the same numbers', () => {
    const q = challenges.find((c) => c.template === 'compound_amount')!;
    const render = () => renderTemplate({ template: q.template!, params: q.params!, prompt: q.prompt, explanation: q.why }, new SeededRandom(42));
    expect(render()).toEqual(render());
  });
});

describe('engines with bank questions', () => {
  const cards: ChallengeCard[] = Array.from({ length: 10 }, (_, i) => ({
    id: `00000000-0000-0000-0000-00000000000${i}`,
    topic: 'Test',
    emoji: '🧪',
    prompt: `Q${i}`,
    options: ['right', 'wrong a', 'wrong b'],
    correctIndex: 0,
    explanation: 'because',
  }));

  it('money challenges plays the bank cards, hides them, and reports answers per question', () => {
    const e = registry.get('money-challenges')!;
    let s = e.init({ cards: 10, questions: cards }, user, 7);
    expect(JSON.stringify(e.publicState(s))).not.toContain('correctIndex');
    expect(JSON.stringify(e.publicState(s))).not.toContain(cards[0].id);
    while (!s.finished) {
      const current = s.current as { options: string[] };
      s = e.applyAction(s, { type: 'ANSWER', payload: { choice: current.options.indexOf('right') } }).state;
    }
    const answered = e.answeredQuestions!(s);
    expect(answered).toHaveLength(10);
    expect(answered.every((a) => a.correct)).toBe(true);
    expect(new Set(answered.map((a) => a.questionId))).toEqual(new Set(cards.map((c) => c.id)));
  });

  it('scam or legit plays the bank messages and reports answers per question', () => {
    const msgs: ScamMessage[] = Array.from({ length: 12 }, (_, i) => ({
      id: `msg-uuid-${i}`,
      channel: 'SMS',
      sender: 'X',
      body: `Body ${i}`,
      isScam: i < 7,
      redFlags: [],
      explanation: 'because',
    }));
    const e = registry.get('scam-or-legit')!;
    let s = e.init({ cards: 12, questions: msgs }, user, 3);
    expect(JSON.stringify(e.publicState(s))).not.toContain('msg-uuid');
    while (!s.finished) s = e.applyAction(s, { type: 'SCAM' }).state;
    const answered = e.answeredQuestions!(s);
    expect(answered).toHaveLength(12);
    expect(answered.filter((a) => a.correct)).toHaveLength(7);
  });

  it('falls back to built-in questions when none are given', () => {
    const e = registry.get('money-challenges')!;
    const s = e.init({ cards: 10 }, user, 1);
    expect(s.current).toBeTruthy();
    expect(e.answeredQuestions!(s)).toEqual([]);
  });
});
