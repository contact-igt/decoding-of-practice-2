import { randomBytes } from 'node:crypto';
import { NextRequest } from 'next/server';
import { campaign } from '../../../lib/course';
import { validateLead } from '../../../lib/enquiry';
import { lifetime, register } from '../../../lib/server/attempt';
import { body, failure, gate, json, owner, sessionName } from '../../../lib/server/http';
import { saveRegistrationToSheet } from '../../../lib/server/sheet-intake';
import { receiptCookie, receiptSeconds, signReceipt } from '../../../lib/receipt';

export const runtime = 'nodejs';
export function PUT(request: NextRequest) {
  try {
    gate(request, true);
    const response = json({ ready: true });
    if (!request.cookies.has(sessionName)) response.cookies.set(sessionName, randomBytes(32).toString('hex'), {
      httpOnly: true, sameSite: 'strict', secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: lifetime,
    });
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
    if (process.env.DOP_GOOGLE_SHEETS_URL) {
      owner(request);
      const saved = await saveRegistrationToSheet(key, lead);
      const response = json({ accepted: true, created: saved.created, mode: 'webhook', next: 'confirmation' });
      response.cookies.set(receiptCookie, signReceipt(key, 'webhook', process.env.DOP_GOOGLE_SHEETS_TOKEN!), {
        httpOnly: true, sameSite: 'strict', secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: receiptSeconds,
      });
      return response;
    }
    const receipt = register(owner(request), key, lead);
    return json({ accepted: true, ...receipt, mode: 'local' });
  } catch (error) { return failure(error); }
}
