import { randomInt } from 'node:crypto';
import source from './vls-banks.json' with { type: 'json' };

export type Question = { id: string; prompt: string; choices: string[]; correct: number | null; shuffleOptions: boolean; review: string };
type Bank = { subject: string; questions: Question[] };
export const sourceBanks: Bank[] = source.banks;
export const bankVersion = 'fixture-2026-11-26.1';
export const policy = { version: 'demo-nine-v1', weight: 1, negative: 0, retakes: false, concessionAmount: null,
  tiers: [{ min: 9, name: 'highest' }, { min: 7, name: 'higher' }, { min: 5, name: 'standard' }] };

// Non-legal test data. Real source questions never inherit a fixture answer.
export const fixtureBanks: Bank[] = sourceBanks.map(({ subject }, group) => ({
  subject, questions: Array.from({ length: 6 }, (_, index) => {
    const label = ['Cedar', 'Elm', 'Ash', 'Oak', 'Pine', 'Birch'][index];
    const correct = (index + group) % 4;
    const choices = ['Amber', 'Indigo', 'Coral', 'Ivory'];
    choices[correct] = label;
    return { id: 'fixture-' + group + '-' + index, prompt: 'Practice set ' + (group + 1) + ' · Select the label “' + label + '”.',
      choices, correct, shuffleOptions: index !== 0, review: 'fixture' };
  }),
}));

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type Assigned = { id: string; subject: string; prompt: string; choices: string[]; order: number[]; key: number };
export function assign(banks: Bank[], fixture = false): Assigned[] {
  if (banks.length !== 3 || new Set(banks.map(bank => bank.subject)).size !== 3) throw Error('Three separate banks required');
  const ids = new Set<string>(), prompts = new Set<string>();
  return shuffle(banks.flatMap(bank => {
    const eligible = bank.questions.filter(q => {
      if (q.review !== (fixture ? 'fixture' : 'faculty-approved') || q.correct === null || !Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.choices.length || q.choices.length !== 4 || new Set(q.choices).size !== 4) return false;
      const prompt = q.prompt.replace(/^\s*\d+[.)]\s*/, '').trim().toLowerCase();
      if (ids.has(q.id) || prompts.has(prompt)) throw Error('Duplicate approved question');
      ids.add(q.id); prompts.add(prompt);
      return true;
    });
    if (eligible.length < 3) throw Error('Insufficient verified questions');
    return shuffle(eligible).slice(0, 3).map(q => {
      const indexes = q.choices.map((_, i) => i);
      const order = q.shuffleOptions ? shuffle(indexes) : indexes;
      return { id: q.id, subject: bank.subject, prompt: q.prompt, choices: order.map(i => q.choices[i]), order, key: order.indexOf(q.correct!) };
    });
  }));
}
export function evaluate(assigned: Assigned[], answers: (number | null)[]) {
  if (assigned.length !== 9 || answers.length !== 9) throw Error('Nine responses required');
  const subjectScores: Record<string, number> = {};
  let score = 0;
  for (const [i, q] of assigned.entries()) {
    const answer = answers[i];
    if (answer === null || !Number.isInteger(answer) || answer < 0 || answer >= q.choices.length) throw Error('Invalid response');
    const mark = answer === q.key ? policy.weight : policy.negative;
    subjectScores[q.subject] = (subjectScores[q.subject] ?? 0) + mark;
    score += mark;
  }
  const tier = policy.tiers.find(t => score >= t.min)?.name ?? null;
  return { score, maximum: 9, subjectScores, subjectMaximum: 3, tier, qualified: tier !== null };
}
