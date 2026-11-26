import type { Lead } from '../enquiry';

// Call from a registration route after validation, before reporting success.
export async function saveRegistrationToSheet(requestId: string, lead: Lead) {
  const endpoint = new URL(process.env.DOP_GOOGLE_SHEETS_URL || '');
  const token = process.env.DOP_GOOGLE_SHEETS_TOKEN || '';
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname) || endpoint.search || token.length < 32) throw new Error('Sheet intake is not configured.');
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, token, lead: {
      fullName: lead.fullName, phone: lead.phone, email: lead.email, status: lead.status,
      consent: lead.consent, marketingConsent: lead.marketingConsent, variant: lead.variant,
    } }),
    redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok || result.accepted !== true || result.requestId !== requestId) throw new Error('Sheet did not acknowledge registration.');
  return { created: result.duplicate !== true };
}
