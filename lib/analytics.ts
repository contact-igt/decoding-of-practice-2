import { attributionKeys, cleanAttribution } from './enquiry';

type EventValue = string | number | boolean;
type EventData = Record<string, EventValue>;

declare global {
  interface Window { dataLayer?: Array<Record<string, unknown> | IArguments> }
}

const attributionStorage = 'vls-dop-attribution-v1';
const consentStorage = 'vls-dop-analytics-v1';

export function track(event: string, data: EventData = {}) {
  window.dataLayer ||= [];
  window.dataLayer.push({ event, ...data });
}

export function attribution() {
  const params = new URLSearchParams(location.search);
  const current = Object.fromEntries(attributionKeys.flatMap(key => params.has(key) ? [[key, params.get(key)]] : []));
  const referrer = document.referrer;
  const touch = cleanAttribution({ latest: { ...current, referrer } }).latest;
  const hasCampaign = attributionKeys.some(key => touch?.[key] !== undefined);
  const isExternal = touch?.referrer && touch.referrer !== location.origin;
  try {
    const previous = cleanAttribution(JSON.parse(sessionStorage.getItem(attributionStorage) ?? '{}'));
    const first = Object.keys(previous.first ?? {}).length ? previous.first : touch;
    const latest = hasCampaign || isExternal || !Object.keys(previous.latest ?? {}).length ? touch : previous.latest;
    const result = { first, latest };
    sessionStorage.setItem(attributionStorage, JSON.stringify(result));
    return result;
  } catch {
    return { first: touch, latest: touch };
  }
}

export function savedConsent(): string | null {
  try { return localStorage.getItem(consentStorage); }
  catch { return 'denied'; }
}

export function setSavedConsent(granted: boolean) {
  try { localStorage.setItem(consentStorage, granted ? 'granted' : 'denied'); }
  catch { /* Preferences apply to this page when storage is unavailable. */ }
}

export function trackAccepted(eventId: string, mode: 'local' | 'webhook', variant: string) {
  const storageKey = 'vls-dop-accepted-' + eventId;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');
  } catch { /* The form also prevents concurrent submissions. */ }
  track(mode === 'local' ? 'dop_local_test_success' : 'admission_lead_success', { event_id: eventId, variant });
}
