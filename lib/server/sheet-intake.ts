import type { Lead } from '../enquiry';

async function saveToSheet(requestId: string, payload: object) {
  const endpoint = new URL(process.env.DOP_GOOGLE_SHEETS_URL || '');
  const token = process.env.DOP_GOOGLE_SHEETS_TOKEN || '';
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname) || endpoint.search || token.length < 32) throw new Error('Sheet intake is not configured.');
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, token, ...payload }),
    redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok || result.accepted !== true || result.requestId !== requestId) throw new Error('Sheet did not acknowledge the write.');
  return { created: result.duplicate !== true };
}

export function saveRegistrationToSheet(requestId: string, lead: Lead) {
  return saveToSheet(requestId, { lead: {
      fullName: lead.fullName, phone: lead.phone, email: lead.email, status: lead.status,
      consent: lead.consent, marketingConsent: lead.marketingConsent, variant: lead.variant,
      objective: lead.objective, timeline: lead.timeline, question: lead.question,
      attribution: lead.attribution,
    } });
}

export function saveAssessmentToSheet(requestId: string, responses: { question: string; answer: string }[]) {
  return saveToSheet(requestId, { action: 'assessment', responses });
}
