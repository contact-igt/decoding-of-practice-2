import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { assign, bankVersion, evaluate, fixtureBanks, policy, type Assigned } from './bank.ts';
import type { Lead } from '../enquiry.ts';

export class Problem extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const lifetime = 7 * 86400;
type Entry = {
  applicantReference: string; attemptId: string; lead: Lead; questionBankVersion: string; policyVersion: string; consentVersion: string;
  registeredAt: string; startedAt: string | null; completedAt: string | null; lifecycle: string[]; completionStatus: string;
  qualificationStatus: string; admissionStatus: string; adminConfirmedConcession: null; assigned: Assigned[];
  answers: (number | null)[]; step: number; revision: number; result: ReturnType<typeof evaluate> | null;
};
let db: DatabaseSync;
export function storage() {
  if (db) return db;
  const dir = process.env.DOP_TEST_STORE || join(process.cwd(), 'work', 'assessment-local');
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
export function register(owner: string, registrationKey: string, lead: Lead) {
  return transaction(db => {
    const existing = lookup(db, owner);
    if (existing && existing.lead.phone === lead.phone && existing.lead.fullName === lead.fullName) return { created: false };
    if (existing || db.prepare('SELECT 1 FROM attempts WHERE phone=? OR registrationKey=?').get(digest(lead.phone), digest(registrationKey))) {
      throw new Problem(409, 'Registration could not be started. Resume in the original browser or contact VLS for assistance.');
    }
    const entry: Entry = { applicantReference: 'VLS-' + randomUUID().slice(0, 13).toUpperCase(), attemptId: randomUUID(), lead,
      questionBankVersion: bankVersion, policyVersion: policy.version, consentVersion: 'registration-v2', registeredAt: new Date().toISOString(),
      startedAt: null, completedAt: null, completionStatus: 'REGISTERED', qualificationStatus: 'PENDING', admissionStatus: 'PENDING_ASSESSMENT',
      lifecycle: ['REGISTERED'], adminConfirmedConcession: null, assigned: assign(fixtureBanks, true),
      answers: Array(9).fill(null), step: 0, revision: 0, result: null };
    db.prepare('INSERT INTO attempts VALUES(?,?,?,?,?)').run(digest(owner), digest(lead.phone), digest(registrationKey), Date.now() + lifetime * 1000, JSON.stringify(entry));
    return { created: true };
  });
}
export function attempt(owner: string, action: 'read' | 'start' | 'save' | 'finish', input: Record<string, unknown> = {}) {
  return transaction(db => {
    const e = lookup(db, owner);
    if (!e) throw new Problem(401, 'Register first, or resume using the browser where you registered.');
    let changed = false;
    if (action === 'start' && !e.startedAt) {
      e.startedAt = new Date().toISOString(); e.completionStatus = 'ASSESSMENT_IN_PROGRESS'; e.lifecycle.push(e.completionStatus); changed = true;
    }
    if (action === 'save' || (action === 'finish' && !e.result)) {
      if (!e.startedAt || e.result || input.revision !== e.revision) throw new Problem(409, 'This attempt has changed. Reload to see your saved progress.');
      if (action === 'save') {
        const { index, choice, step } = input;
        if (index !== e.step || typeof step !== 'number' || !Number.isInteger(step) || step < 0 || step > 9 ||
            (choice !== null && (typeof choice !== 'number' || !Number.isInteger(choice) || choice < 0 || choice > 3 || e.step > 8))) throw new Problem(422, 'Invalid question or choice.');
        if (choice !== null) e.answers[e.step] = choice as number;
        if (step === 9 && e.answers.includes(null)) throw new Problem(422, 'Answer all nine questions before review.');
        e.step = step;
      } else {
        if (e.step !== 9 || e.answers.includes(null)) throw new Problem(422, 'Review all nine answers before submitting.');
        e.result = evaluate(e.assigned, e.answers);
        e.completedAt = new Date().toISOString(); e.completionStatus = 'ASSESSMENT_COMPLETED';
        e.qualificationStatus = e.result.qualified ? 'QUALIFIED' : 'NOT_YET_QUALIFIED';
        e.admissionStatus = e.result.qualified ? 'PENDING_ADMIN_REVIEW' : 'COUNSELLING_REQUIRED';
        e.lifecycle.push(e.completionStatus, e.qualificationStatus);
        if (!e.result.qualified) e.lifecycle.push('COUNSELLING_REQUIRED');
      }
      changed = true;
    }
    if (changed) {
      e.revision++;
      db.prepare('UPDATE attempts SET record=? WHERE owner=?').run(JSON.stringify(e), digest(owner));
    }
    return { changed, step: e.step, revision: e.revision, started: Boolean(e.startedAt), variant: e.lead.variant,
      answers: e.result ? [] : e.answers, questions: e.result ? [] : e.assigned.map(({ prompt, choices, subject }) => ({ prompt, choices, subject })),
      result: e.result && { score: e.result.score, qualified: e.result.qualified, reference: e.applicantReference } };
  });
}
