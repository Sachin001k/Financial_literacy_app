import 'server-only';
import { ASSESSMENT_QUESTIONS } from '@/lib/content/lessons';
import { ApiError } from './http';

/** Scores answers to the shared assessment bank: overall % and % per topic. */
export function scoreAssessment(answers: number[]) {
  if (answers.length !== ASSESSMENT_QUESTIONS.length) throw new ApiError(400, 'ANSWER_COUNT', `Expected ${ASSESSMENT_QUESTIONS.length} answers.`);
  const byTopic: Record<string, { right: number; total: number }> = {};
  let right = 0;
  ASSESSMENT_QUESTIONS.forEach((q, i) => {
    const t = (byTopic[q.topic] ??= { right: 0, total: 0 });
    t.total++;
    if (answers[i] === q.correctIndex) {
      t.right++;
      right++;
    }
  });
  const breakdown = Object.fromEntries(Object.entries(byTopic).map(([k, v]) => [k, Math.round((v.right / v.total) * 100)]));
  const score = Math.round((right / Math.max(1, ASSESSMENT_QUESTIONS.length)) * 100);
  const review = ASSESSMENT_QUESTIONS.map((q, i) => ({ correct: answers[i] === q.correctIndex, correctIndex: q.correctIndex, explanation: q.explanation }));
  return { score, breakdown, review };
}
