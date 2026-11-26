import { NextRequest } from 'next/server';
import { acknowledgeSheet, attempt, pendingSheetRegistration, pendingSheetSubmission, Problem } from '../../../lib/server/attempt';
import { body, failure, gate, json, owner } from '../../../lib/server/http';
import { saveAssessmentToSheet, saveRegistrationToSheet } from '../../../lib/server/sheet-intake';

export const runtime = 'nodejs';
function publicView(view: Awaited<ReturnType<typeof attempt>>) {
  return json({ ...view, result: view.result && { reference: view.result.reference } });
}
async function handle(request: NextRequest, action: Parameters<typeof attempt>[1]) {
  try {
    gate(request);
    const data = action === 'finish' || action === 'save' ? await body(request) : {};
    if ((action === 'finish' || action === 'save') && typeof data.attemptId !== 'string') {
      throw new Problem(409, 'Reload to open the current assessment.');
    }
    const session = owner(request);
    if (action === 'start') {
      const registration = await pendingSheetRegistration(session);
      if (registration) {
        try { await saveRegistrationToSheet(registration.requestId, registration.lead); }
        catch { throw new Problem(503, 'Your registration is saved. Reload this page to retry confirmation.'); }
        await acknowledgeSheet(session, 'sheetRegistered');
      }
    }
    const view = await attempt(session, action, data);
    const pending = action === 'finish' ? await pendingSheetSubmission(session) : null;
    if (!pending) return publicView(view);
    try { await saveAssessmentToSheet(pending.requestId, pending.responses); }
    catch { throw new Problem(503, 'Your answers are saved. Submit again to confirm delivery.'); }
    const changed = await acknowledgeSheet(session, 'sheetDelivered');
    return publicView({ ...await attempt(session, 'read'), changed });
  } catch (error) { return failure(error); }
}
export const GET = (r: NextRequest) => handle(r, 'read');
export const PUT = (r: NextRequest) => handle(r, 'start');
export const PATCH = (r: NextRequest) => handle(r, 'save');
export const POST = (r: NextRequest) => handle(r, 'finish');
