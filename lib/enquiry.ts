export const statuses = ['Pursuing LLB', 'Final-year student', 'Law graduate', 'Junior advocate', 'Practising advocate', 'Returning to legal practice', 'Other'] as const;
export const objectives = ['Start legal practice', 'Improve drafting', 'Understand court procedures', 'Build practical confidence', 'Expand into new practice areas', 'Restart my legal career', 'Other'] as const;
export const timelines = ['Immediately', 'Upcoming batch', 'Within three months', 'Currently exploring'] as const;
export const attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid'] as const;

type Input = Record<string, unknown>;
type ContactFields = { fullName: string; phone: string; email: string };
type BackgroundFields = { status: string; objective: string; timeline: string; consent: boolean; marketingConsent: boolean; question: string };
export type Errors = Partial<Record<keyof ContactFields | keyof BackgroundFields, string>>;
type Touch = Partial<Record<typeof attributionKeys[number] | 'referrer', string>>;
export type Attribution = { first?: Touch; latest?: Touch };
export type Lead = ContactFields & BackgroundFields & { attribution: Attribution; variant: string };

export function object(value: unknown): Input {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Input : {};
}

const string = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export function normalisePhone(value: string) {
  if (!/^[+\d ().-]+$/.test(value) || value.length > 32) return '';
  const plain = value.replace(/[ ().-]/g, '');
  if (/^[6-9]\d{9}$/.test(plain)) return '+91' + plain;
  if (/^0[6-9]\d{9}$/.test(plain)) return '+91' + plain.slice(1);
  if (/^91[6-9]\d{9}$/.test(plain)) return '+' + plain;
  if (plain.startsWith('+91')) return /^\+91[6-9]\d{9}$/.test(plain) ? plain : '';
  return /^\+[1-9]\d{7,14}$/.test(plain) ? plain : '';
}

export function validateContact(input: Input) {
  const contact = { fullName: string(input.fullName), phone: normalisePhone(string(input.phone)), email: string(input.email) };
  const errors: Errors = {};
  if (contact.fullName.length < 2 || contact.fullName.length > 100 || !/\p{L}/u.test(contact.fullName)) errors.fullName = 'Enter your full name.';
  if (!contact.phone) errors.phone = 'Enter a valid Indian mobile number or an international number with its country code.';
  if (!contact.email || contact.email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(contact.email)) errors.email = 'Enter a valid email address.';
  return { contact, errors };
}

function cleanTouch(input: unknown): Touch {
  const data = object(input);
  const touch: Touch = {};
  for (const key of attributionKeys) {
    const value = string(data[key]);
    if (value.length <= 160 && /^[\p{L}\p{N} _.:+~()/-]+$/u.test(value)) touch[key] = value;
  }
  try {
    const url = new URL(string(data.referrer));
    if (['http:', 'https:'].includes(url.protocol) && url.hostname.length <= 160) touch.referrer = url.origin;
  } catch {
    // Direct visits have no referrer.
  }
  return touch;
}

export function cleanAttribution(input: unknown): Attribution {
  const data = object(input);
  return { first: cleanTouch(data.first), latest: cleanTouch(data.latest) };
}

export function validateLead(input: Input, effectiveVariant?: string) {
  const { contact, errors } = validateContact(input);
  const background: BackgroundFields = {
    status: string(input.status), objective: string(input.objective), timeline: string(input.timeline),
    consent: input.consent === true, marketingConsent: input.marketingConsent === true, question: string(input.question),
  };
  if (!statuses.some(value => value === background.status)) errors.status = 'Select your current professional status.';
  if (background.objective && !objectives.some(value => value === background.objective)) errors.objective = 'Select your main learning objective.';
  if (background.timeline && !timelines.some(value => value === background.timeline)) errors.timeline = 'Select when you are considering joining.';
  if (!background.consent) errors.consent = 'Confirm that the VLS admissions team may contact you.';
  if (background.question.length > 500) errors.question = 'Keep your question to 500 characters or fewer.';
  const variant = effectiveVariant && /^[A-E]$/.test(effectiveVariant) ? effectiveVariant : 'A';
  const lead: Lead = { ...contact, ...background, attribution: cleanAttribution(input.attribution), variant };
  return { lead, errors };
}
