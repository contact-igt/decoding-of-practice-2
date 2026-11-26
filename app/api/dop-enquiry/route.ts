import { randomBytes } from 'node:crypto';
import { NextRequest } from 'next/server';
import { campaign } from '../../../lib/course';
import { validateLead } from '../../../lib/enquiry';
import { acknowledgeSheet, lifetime, register } from '../../../lib/server/attempt';
import { body, failure, gate, json, owner, sessionName } from '../../../lib/server/http';
import { sheetAssessmentEnabled } from '../../../lib/server/assessment-config';
import { saveRegistrationToSheet } from '../../../lib/server/sheet-intake';
import { receiptCookie, receiptSeconds, signReceipt } from '../../../lib/receipt';

export const runtime = 'nodejs';
const draftSession = 'dop_registration_draft';
function newSession(request: NextRequest, response: ReturnType<typeof json>, name = sessionName, token = randomBytes(32).toString('hex')) {
  response.cookies.set(name, token, {
    httpOnly: true, sameSite: 'strict', secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: lifetime,
  });
  return response;
}

export function PUT(request: NextRequest) {
  try {
    gate(request, true);
    const response = json({ ready: true });
    if (request.nextUrl.searchParams.get('new') === '1') {
      return request.cookies.has(draftSession) ? response : newSession(request, response, draftSession);
    }
    if (!request.cookies.has(sessionName)) return newSession(request, response);
    return response;
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    gate(request, true);
    const input = await body(request);
    const key = request.headers.get('idempotency-key') ?? '';
    if (!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(key)) return json({ message: 'Reload and retry registration.' }, 400);
    if (input.website) return json({ message: 'Registration could not be accepted.' }, 422);
    const variant = campaign(typeof input.variant === 'string' ? input.variant : undefined).id;
    const { lead, errors } = validateLead(input, variant);
    if (Object.keys(errors).length) return json({ errors }, 422);
    const isNew = request.nextUrl.searchParams.get('new') === '1';
    const session = owner(request, isNew ? draftSession : sessionName);
    function accepted(data: object) {
      const response = json(data);
      if (isNew) {
        newSession(request, response, sessionName, session);
        response.cookies.delete(draftSession);
      }
      return response;
    }
    if (process.env.DOP_GOOGLE_SHEETS_URL) {
      if (sheetAssessmentEnabled()) {
        const { registration } = await register(session, key, lead, 'sheet');
        if (!registration) throw new Error('Assessment registration is unavailable.');
        const saved = await saveRegistrationToSheet(registration.requestId, registration.lead);
        await acknowledgeSheet(session, 'sheetRegistered');
        return accepted({ accepted: true, created: saved.created, mode: 'webhook' });
      }
      const saved = await saveRegistrationToSheet(key, lead);
      const response = accepted({ accepted: true, created: saved.created, mode: 'webhook', next: 'confirmation' });
      response.cookies.set(receiptCookie, signReceipt(key, 'webhook', process.env.DOP_GOOGLE_SHEETS_TOKEN!), {
        httpOnly: true, sameSite: 'strict', secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: receiptSeconds,
      });
      return response;
    }
    const receipt = await register(session, key, lead, 'local');
    return accepted({ accepted: true, created: receipt.created, mode: 'local' });
  } catch (error) { return failure(error); }
}
