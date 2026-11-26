import { createHash, randomUUID } from 'node:crypto';
import { insertAttempt, readAttempt, updateAttempt } from './attempt-store.ts';
import { assign, assignForCollection, bankVersion, displayPrompt, evaluate, fixtureBanks, policy, sourceVersion, type Assigned } from './bank.ts';
import type { Lead } from '../enquiry.ts';

export class Problem extends Error {
  status: number;
  readonly code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const lifetime = 7 * 86400;
type Entry = {
  applicantReference: string; attemptId: string; lead: Lead; questionBankVersion: string; policyVersion: string; consentVersion: string;
  registeredAt: string; startedAt: string | null; completedAt: string | null; lifecycle: string[]; completionStatus: string;
  qualificationStatus: string; admissionStatus: string; adminConfirmedConcession: null; assigned: Assigned[];
  answers: (number | null)[]; step: number; revision: number; result: ReturnType<typeof evaluate> | null;
  sheetRequestId?: string; sheetRegistered?: boolean; sheetDelivered?: boolean; collectOnly?: boolean;
};
async function lookup(owner: string) {
  const row = await readAttempt(digest(owner));
  if (row && Number(row.expires) < Date.now()) throw new Problem(410, 'Your session has expired. Contact VLS for help with your existing application.');
  return row ? { entry: JSON.parse(row.record) as Entry, record: row.record } : null;
}

export async function register(owner: string, registrationKey: string, lead: Lead, mode?: 'local' | 'sheet') {
  const existing = (await lookup(owner))?.entry;
  if (existing) return registered(existing);
  const entry: Entry = { applicantReference: 'VLS-' + randomUUID().slice(0, 13).toUpperCase(), attemptId: randomUUID(), lead,
    questionBankVersion: mode === 'sheet' ? sourceVersion : bankVersion, policyVersion: mode ? 'collect-only' : policy.version, consentVersion: 'registration-v2', registeredAt: new Date().toISOString(),
    startedAt: null, completedAt: null, completionStatus: 'REGISTERED', qualificationStatus: 'PENDING', admissionStatus: 'PENDING_ASSESSMENT',
    lifecycle: ['REGISTERED'], adminConfirmedConcession: null, assigned: mode === 'sheet' ? assignForCollection() : assign(fixtureBanks, true, Boolean(mode)),
    collectOnly: Boolean(mode), sheetRequestId: mode === 'sheet' ? registrationKey : undefined,
    answers: Array(9).fill(null), step: 0, revision: 0, result: null };
  const inserted = await insertAttempt(digest(owner), digest(lead.phone), digest(registrationKey), Date.now() + lifetime * 1000, JSON.stringify(entry));
  if (inserted) return { created: true, registration: entry.sheetRequestId ? { requestId: entry.sheetRequestId, lead } : undefined };
  const concurrent = (await lookup(owner))?.entry;
  if (concurrent) return registered(concurrent);
  throw new Problem(409, 'Registration could not be started. If you registered earlier, use that browser session or contact VLS for help.');

  function registered(saved: Entry) {
    if (saved.lead.phone !== lead.phone || saved.lead.fullName !== lead.fullName ||
        (mode === 'sheet' && (!saved.sheetRequestId || saved.lead.email !== lead.email))) {
      throw new Problem(409, 'This browser already has a saved registration. Open it to continue.', 'RESUME_ASSESSMENT');
    }
    return { created: false, registration: saved.sheetRequestId ? { requestId: saved.sheetRequestId, lead: saved.lead } : undefined };
  }
}

export async function acknowledgeSheet(owner: string, field: 'sheetRegistered' | 'sheetDelivered') {
  for (let retry = 0; retry < 3; retry++) {
    const saved = await lookup(owner);
    if (!saved?.entry.sheetRequestId) throw new Problem(409, 'Assessment registration is unavailable.');
    if (saved.entry[field]) return false;
    saved.entry[field] = true;
    if (await updateAttempt(digest(owner), saved.record, JSON.stringify(saved.entry))) return true;
  }
  throw new Problem(409, 'This attempt has changed. Retry to confirm delivery.');
}

export async function pendingSheetSubmission(owner: string) {
  const entry = (await lookup(owner))?.entry;
  if (!entry?.sheetRequestId || !entry.completedAt || entry.sheetDelivered) return null;
  return { requestId: entry.sheetRequestId, responses: entry.assigned.map((question, index) => ({
    question: displayPrompt(question.prompt), answer: question.choices[entry.answers[index]!],
  })) };
}

export async function pendingSheetRegistration(owner: string) {
  const entry = (await lookup(owner))?.entry;
  if (!entry?.sheetRequestId || entry.sheetRegistered) return null;
  return { requestId: entry.sheetRequestId, lead: entry.lead };
}
export async function attempt(owner: string, action: 'read' | 'start' | 'save' | 'finish', input: Record<string, unknown> = {}) {
  const saved = await lookup(owner);
  if (!saved) throw new Problem(401, 'Register first, or resume using the browser where you registered.');
  const e = saved.entry;
  if (e.sheetRequestId && !e.sheetRegistered) throw new Problem(409, 'Finish registration before starting your assessment.');
  let changed = false;
  if (action === 'start' && !e.startedAt) {
    e.startedAt = new Date().toISOString(); e.completionStatus = 'ASSESSMENT_IN_PROGRESS'; e.lifecycle.push(e.completionStatus); changed = true;
  }
  if (action === 'save' || (action === 'finish' && !e.completedAt)) {
    if (!e.startedAt || e.completedAt || input.revision !== e.revision) throw new Problem(409, 'This attempt has changed. Reload to see your saved progress.');
    if (action === 'save') {
      const { index, choice, step } = input;
      if (index !== e.step || typeof step !== 'number' || !Number.isInteger(step) || step < 0 || step > 9 ||
          (choice !== null && (typeof choice !== 'number' || !Number.isInteger(choice) || choice < 0 || choice >= (e.assigned[e.step]?.choices.length ?? 0)))) throw new Problem(422, 'Invalid question or choice.');
      if (choice !== null) e.answers[e.step] = choice as number;
      if (step === 9 && e.answers.includes(null)) throw new Problem(422, 'Answer all nine questions before review.');
      e.step = step;
    } else {
      if (e.step !== 9 || e.answers.includes(null)) throw new Problem(422, 'Review all nine answers before submitting.');
      if (!e.collectOnly) e.result = evaluate(e.assigned, e.answers);
      e.completedAt = new Date().toISOString(); e.completionStatus = 'ASSESSMENT_COMPLETED';
      e.qualificationStatus = e.result ? (e.result.qualified ? 'QUALIFIED' : 'NOT_YET_QUALIFIED') : 'PENDING';
      e.admissionStatus = e.result && !e.result.qualified ? 'COUNSELLING_REQUIRED' : 'PENDING_ADMIN_REVIEW';
      e.lifecycle.push(e.completionStatus);
      if (e.result) e.lifecycle.push(e.qualificationStatus);
      if (e.admissionStatus === 'COUNSELLING_REQUIRED') e.lifecycle.push(e.admissionStatus);
    }
    changed = true;
  }
  if (changed) {
    e.revision++;
    if (!await updateAttempt(digest(owner), saved.record, JSON.stringify(e))) {
      throw new Problem(409, 'This attempt has changed. Reload to see your saved progress.');
    }
  }
  const confirmed = Boolean(e.completedAt && (!e.sheetRequestId || e.sheetDelivered));
  return { changed, step: e.step, revision: e.revision, started: Boolean(e.startedAt), variant: e.lead.variant,
    mode: e.sheetRequestId ? 'webhook' as const : 'local' as const,
    pendingDelivery: Boolean(e.completedAt && !confirmed),
    answers: confirmed ? [] : e.answers, questions: confirmed ? [] : e.assigned.map(({ prompt, choices, subject }) => ({ prompt: displayPrompt(prompt), choices, subject })),
    result: confirmed ? { reference: e.applicantReference, ...(e.result && { score: e.result.score, qualified: e.result.qualified }) } : null };
}
