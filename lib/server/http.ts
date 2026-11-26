import { NextRequest, NextResponse } from 'next/server';
import { object } from '../enquiry';
import { leadConfig } from '../receipt';
import { Problem } from './attempt';

const limit = 8192;
const recent = new Map<string, { count: number; until: number }>();
export async function boundedJson(request: Request) {
  if (!request.body) throw new SyntaxError();
  const reader = request.body.getReader();
  const buffer = new Uint8Array(limit);
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.length > limit) {
        await reader.cancel();
        throw new RangeError();
      }
      buffer.set(value, length);
      length += value.length;
    }
    return object(JSON.parse(new TextDecoder().decode(buffer.subarray(0, length))));
  } finally {
    reader.releaseLock();
  }
}


export function gate(request: NextRequest, registration = false) {
  const host = request.headers.get('host') ?? '';
  const sheet = (registration || sheetAssessmentEnabled()) && Boolean(process.env.DOP_GOOGLE_SHEETS_URL && (process.env.DOP_GOOGLE_SHEETS_TOKEN?.length ?? 0) >= 32);
  if (!sheet && (!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host) || leadConfig(new URL('http://' + host).hostname)?.mode !== 'local'))
    throw new Problem(503, 'Online assessment registration is awaiting approval. Contact VLS for assistance.');
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== request.nextUrl.protocol + '//' + host))
    throw new Problem(403, 'Open the assessment on this site.');
  const now = Date.now();
  for (const [key, record] of recent) if (record.until <= now) recent.delete(key);
  const bucket = request.nextUrl.pathname + (request.method === 'PUT' || request.method === 'POST' && request.nextUrl.pathname.endsWith('enquiry') ? ':register' : ':attempt');
  const record = recent.get(bucket) ?? { count: 0, until: now + 60000 };
  recent.set(bucket, record);
  if (++record.count > (bucket.endsWith(':register') ? 100 : 1200)) throw new Problem(429, 'Please wait a minute and retry.');
}
export function sheetAssessmentEnabled() {
  return process.env.DOP_UNSCORED_ASSESSMENT === '1' && Boolean(process.env.DOP_ASSESSMENT_STORE && process.env.DOP_GOOGLE_SHEETS_URL);
}
export const sessionName = 'dop_attempt_session';
export function owner(request: NextRequest) {
  const token = request.cookies.get(sessionName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new Problem(401, 'Register first, or resume in the original browser.');
  return token;
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex', Vary: 'Cookie' } });
}
export async function body(request: NextRequest) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new Problem(415, 'Use the assessment form.');
  try { return await boundedJson(request); }
  catch (error) { throw new Problem(error instanceof RangeError ? 413 : 400, 'The request could not be read.'); }
}
export function failure(error: unknown) {
  return error instanceof Problem ? json({ message: error.message, code: error.code }, error.status) : json({ message: 'We could not confirm your changes. Please retry.' }, 503);
}
