import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { neon } from '@neondatabase/serverless';

type Row = { expires: number | string; record: string };
let db: DatabaseSync;

export function storage() {
  if (db) return db;
  const dir = process.env.DOP_TEST_STORE || process.env.DOP_ASSESSMENT_STORE || join(process.cwd(), 'work', 'assessment-local');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, 'attempts.sqlite');
  const connection = new DatabaseSync(file);
  chmodSync(file, 0o600);
  connection.exec('PRAGMA busy_timeout=4000; CREATE TABLE IF NOT EXISTS attempts(owner TEXT PRIMARY KEY, phone TEXT UNIQUE, registrationKey TEXT UNIQUE, expires INTEGER, record TEXT NOT NULL)');
  db = connection;
  return db;
}

function postgres() {
  if (process.env.DOP_TEST_STORE && process.env.VERCEL !== '1') return null;
  if (process.env.DATABASE_URL) return neon(process.env.DATABASE_URL);
  if (process.env.VERCEL === '1') throw Error('Assessment database is unavailable.');
  return null;
}

export async function readAttempt(owner: string): Promise<Row | null> {
  const sql = postgres();
  if (sql) {
    const [row] = await sql`SELECT expires, record FROM dop_assessment_attempts WHERE owner = ${owner}`;
    return row ? { expires: row.expires, record: row.record } : null;
  }
  const row = storage().prepare('SELECT expires, record FROM attempts WHERE owner=?').get(owner);
  return row ? { expires: Number(row.expires), record: String(row.record) } : null;
}

export async function insertAttempt(owner: string, phone: string, key: string, expires: number, record: string) {
  const sql = postgres();
  if (sql) {
    const rows = await sql`INSERT INTO dop_assessment_attempts (owner, phone, registration_key, expires, record)
      VALUES (${owner}, ${phone}, ${key}, ${expires}, ${record}) ON CONFLICT DO NOTHING RETURNING owner`;
    return rows.length === 1;
  }
  return storage().prepare('INSERT INTO attempts VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING')
    .run(owner, phone, key, expires, record).changes === 1;
}

export async function updateAttempt(owner: string, previous: string, record: string) {
  const sql = postgres();
  if (sql) {
    const rows = await sql`UPDATE dop_assessment_attempts SET record = ${record}
      WHERE owner = ${owner} AND record = ${previous} RETURNING owner`;
    return rows.length === 1;
  }
  return storage().prepare('UPDATE attempts SET record=? WHERE owner=? AND record=?')
    .run(record, owner, previous).changes === 1;
}
