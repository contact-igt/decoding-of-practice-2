import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
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
let db: DatabaseSync;
export function storage() {
  if (db) return db;
  const dir = process.env.DOP_ASSESSMENT_STORE || process.env.DOP_TEST_STORE || join(process.cwd(), 'work', 'assessment-local');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, 'attempts.sqlite');
  const connection = new DatabaseSync(file);
  chmodSync(file, 0o600);
  connection.exec('PRAGMA busy_timeout=4000; CREATE TABLE IF NOT EXISTS attempts(owner TEXT PRIMARY KEY, phone TEXT UNIQUE, registrationKey TEXT UNIQUE, expires INTEGER, record TEXT NOT NULL)');
  db = connection;
  return db;
}
export function transaction<T>(fn: (db: DatabaseSync) => T) {
  const connection = storage();
  connection.exec('BEGIN IMMEDIATE');
  try { const value = fn(connection); connection.exec('COMMIT'); return value; }
  catch (error) { connection.exec('ROLLBACK'); throw error; }
}
function lookup(db: DatabaseSync, owner: string) {
  const row = db.prepare('SELECT expires,record FROM attempts WHERE owner=?').get(digest(owner));
  if (row && Number(row.expires) < Date.now()) throw new Problem(410, 'Your session has expired. Contact VLS for help with your existing application.');
  return row ? JSON.parse(String(row.record)) as Entry : null;
}
export function register(owner: string, registrationKey: string, lead: Lead, mode?: 'local' | 'sheet') {
  return transaction(db => {
    const existing = lookup(db, owner);
    if (existing && existing.lead.phone === lead.phone && existing.lead.fullName === lead.fullName &&
        (mode !== 'sheet' || (existing.sheetRequestId && existing.lead.email === lead.email))) {
      return { created: false, registration: existing.sheetRequestId ? { requestId: existing.sheetRequestId, lead: existing.lead } : undefined };
    }
    if (existing) throw new Problem(409, 'This browser already has a saved registration. Open it to continue.', 'RESUME_ASSESSMENT');
    if (db.prepare('SELECT 1 FROM attempts WHERE phone=? OR registrationKey=?').get(digest(lead.phone), digest(registrationKey))) {
      throw new Problem(409, 'Registration could not be started. If you registered earlier, use that browser session or contact VLS for help.');
    }
    const entry: Entry = { applicantReference: 'VLS-' + randomUUID().slice(0, 13).toUpperCase(), attemptId: randomUUID(), lead,
      questionBankVersion: mode === 'sheet' ? sourceVersion : bankVersion, policyVersion: mode ? 'collect-only' : policy.version, consentVersion: 'registration-v2', registeredAt: new Date().toISOString(),
      startedAt: null, completedAt: null, completionStatus: 'REGISTERED', qualificationStatus: 'PENDING', admissionStatus: 'PENDING_ASSESSMENT',
      lifecycle: ['REGISTERED'], adminConfirmedConcession: null, assigned: mode === 'sheet' ? assignForCollection() : assign(fixtureBanks, true, Boolean(mode)),
      collectOnly: Boolean(mode), sheetRequestId: mode === 'sheet' ? registrationKey : undefined,
      answers: Array(9).fill(null), step: 0, revision: 0, result: null };
    db.prepare('INSERT INTO attempts VALUES(?,?,?,?,?)').run(digest(owner), digest(lead.phone), digest(registrationKey), Date.now() + lifetime * 1000, JSON.stringify(entry));
    return { created: true, registration: entry.sheetRequestId ? { requestId: entry.sheetRequestId, lead } : undefined };
  });
}

export function acknowledgeSheet(owner: string, field: 'sheetRegistered' | 'sheetDelivered') {
  return transaction(db => {
    const entry = lookup(db, owner);
    if (!entry?.sheetRequestId) throw new Problem(409, 'Assessment registration is unavailable.');
    if (entry[field]) return false;
    entry[field] = true;
    db.prepare('UPDATE attempts SET record=? WHERE owner=?').run(JSON.stringify(entry), digest(owner));
    return true;
  });
}

export function pendingSheetSubmission(owner: string) {
  const entry = lookup(storage(), owner);
  if (!entry?.sheetRequestId || !entry.completedAt || entry.sheetDelivered) return null;
  return { requestId: entry.sheetRequestId, responses: entry.assigned.map((question, index) => ({
    question: displayPrompt(question.prompt), answer: question.choices[entry.answers[index]!],
  })) };
}

export function pendingSheetRegistration(owner: string) {
  const entry = lookup(storage(), owner);
  if (!entry?.sheetRequestId || entry.sheetRegistered) return null;
  return { requestId: entry.sheetRequestId, lead: entry.lead };
}
export function attempt(owner: string, action: 'read' | 'start' | 'save' | 'finish', input: Record<string, unknown> = {}) {
  return transaction(db => {
    const e = lookup(db, owner);
    if (!e) throw new Problem(401, 'Register first, or resume using the browser where you registered.');
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
      db.prepare('UPDATE attempts SET record=? WHERE owner=?').run(JSON.stringify(e), digest(owner));
    }
    const confirmed = Boolean(e.completedAt && (!e.sheetRequestId || e.sheetDelivered));
    return { changed, step: e.step, revision: e.revision, started: Boolean(e.startedAt), variant: e.lead.variant,
      mode: e.sheetRequestId ? 'webhook' as const : 'local' as const,
      pendingDelivery: Boolean(e.completedAt && !confirmed),
      answers: confirmed ? [] : e.answers, questions: confirmed ? [] : e.assigned.map(({ prompt, choices, subject }) => ({ prompt: displayPrompt(prompt), choices, subject })),
      result: confirmed ? { reference: e.applicantReference, ...(e.result && { score: e.result.score, qualified: e.result.qualified }) } : null };
  });
}
