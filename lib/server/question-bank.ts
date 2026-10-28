import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChallengeCard } from '@/lib/game/engines/money-challenges';
import type { ScamMessage } from '@/lib/game/engines/scam-or-legit';
import { renderTemplate, type ParamSpec } from '@/lib/game/question-templates';
import { hashString, SeededRandom } from '@/lib/game/seeded-random';
import { getSupabaseAdmin } from '@/lib/supabase/server';

interface QuestionRow {
  id: string;
  kind: 'CHALLENGE' | 'SCAM';
  topic: string;
  emoji: string;
  prompt: string;
  options: string[] | null;
  correct_index: number | null;
  explanation: string;
  template: string | null;
  params: Record<string, ParamSpec> | null;
  is_scam: boolean | null;
  meta: { channel?: ScamMessage['channel']; sender?: string; redFlags?: string[] };
}

/** Games whose questions come from the `questions` table. */
export const BANK_GAMES = new Set(['money-challenges', 'scam-or-legit']);

export class QuestionBank {
  constructor(private db: SupabaseClient = getSupabaseAdmin()) {}

  private async draw(userId: string, sessionId: string, kind: QuestionRow['kind'], count: number, opts: { isScam?: boolean; seed?: string } = {}) {
    const { data, error } = await this.db.rpc('draw_questions', {
      p_user: userId,
      p_session: sessionId,
      p_kind: kind,
      p_count: count,
      p_is_scam: opts.isScam ?? null,
      p_seed: opts.seed ?? null,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as QuestionRow[];
  }

  /**
   * Questions for a new session, passed to the engine as `config.questions`.
   * Returns null when the bank isn't available (migration not run, empty table), so the game falls back to its built-in set.
   * `dailySeed` gives every player the same questions; `seed` fixes template numbers for this session.
   */
  async forGame(slug: string, userId: string, sessionId: string, config: Record<string, unknown>, seed: number, dailySeed?: string): Promise<ChallengeCard[] | ScamMessage[] | null> {
    try {
      if (slug === 'money-challenges') {
        const count = Math.round(Number(config.cards ?? 10));
        const rows = await this.draw(userId, sessionId, 'CHALLENGE', count, { seed: dailySeed });
        return rows.length >= count ? rows.map((r) => toCard(r, seed)) : null;
      }
      if (slug === 'scam-or-legit') {
        const count = Math.round(Number(config.cards ?? 12));
        // Keep the mix roughly 60/40 scam/legit so both calls matter.
        const nScam = Math.round(count * 0.6);
        const [scams, legit] = await Promise.all([
          this.draw(userId, sessionId, 'SCAM', nScam, { isScam: true, seed: dailySeed }),
          this.draw(userId, sessionId, 'SCAM', count - nScam, { isScam: false, seed: dailySeed }),
        ]);
        const rows = [...scams, ...legit];
        return rows.length >= count ? rows.map(toMessage) : null;
      }
    } catch (e) {
      console.warn('question bank unavailable, using built-in questions:', (e as Error).message);
    }
    return null;
  }

  /** Marks the answers from a finished game and lets the player's quiz level move up or down. */
  async record(userId: string, sessionId: string, answers: { questionId: string; correct: boolean }[]) {
    if (!answers.length) return;
    const { error } = await this.db.rpc('record_question_answers', {
      p_user: userId,
      p_session: sessionId,
      p_answers: answers.map((a) => ({ id: a.questionId, correct: a.correct })),
    });
    if (error) console.error('record_question_answers failed', error.message);
  }
}

function toCard(r: QuestionRow, seed: number): ChallengeCard {
  const base = { id: r.id, topic: r.topic, emoji: r.emoji };
  if (r.template && r.params) {
    // Seeded per question, so a resumed session or a shared daily shows the same numbers.
    const rng = new SeededRandom((seed ^ hashString(r.id)) >>> 0);
    return { ...base, ...renderTemplate({ template: r.template, params: r.params, prompt: r.prompt, explanation: r.explanation }, rng) };
  }
  return { ...base, prompt: r.prompt, options: r.options ?? [], correctIndex: r.correct_index ?? 0, explanation: r.explanation };
}

function toMessage(r: QuestionRow): ScamMessage {
  return {
    id: r.id,
    channel: r.meta.channel ?? 'SMS',
    sender: r.meta.sender ?? 'Unknown',
    body: r.prompt,
    isScam: Boolean(r.is_scam),
    redFlags: r.meta.redFlags ?? [],
    explanation: r.explanation,
  };
}
