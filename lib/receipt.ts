import { createHmac, timingSafeEqual } from 'node:crypto';

export const receiptCookie = 'vls_dop_receipt';
export const receiptSeconds = 900;
export type Mode = 'local' | 'webhook';

export function leadConfig(hostname: string) {
  const { DOP_ALLOW_INDEXING, DOP_LOCAL_TEST, DOP_LEAD_WEBHOOK_URL, DOP_LEAD_WEBHOOK_TOKEN, DOP_RECEIPT_SECRET } = process.env;
  if (DOP_LEAD_WEBHOOK_TOKEN && DOP_RECEIPT_SECRET && DOP_RECEIPT_SECRET.length >= 32 && DOP_LEAD_WEBHOOK_URL) {
    try {
      const endpoint = new URL(DOP_LEAD_WEBHOOK_URL);
      if (endpoint.protocol === 'https:' && !endpoint.username && !endpoint.password) {
        return { mode: 'webhook', endpoint, token: DOP_LEAD_WEBHOOK_TOKEN, secret: DOP_RECEIPT_SECRET } as const;
      }
    } catch {
      return null;
    }
  }
  if (DOP_LOCAL_TEST === '1' && DOP_ALLOW_INDEXING !== 'true' && ['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    return { mode: 'local', secret: 'dop-development-receipt-do-not-use-in-production' } as const;
  }
  return null;
}

export function signReceipt(id: string, mode: Mode, secret: string) {
  const data = [mode, id, Math.floor(Date.now() / 1000) + receiptSeconds].join('.');
  return data + '.' + createHmac('sha256', secret).update(data).digest('hex');
}

export function verifyReceipt(value: string, mode: Mode, secret: string) {
  const [kind, id, expires, signature, extra] = value.split('.');
  if (extra !== undefined || kind !== mode || !/^[\da-f-]{36}$/i.test(id ?? '') || !/^\d{10}$/.test(expires ?? '') || !/^[\da-f]{64}$/i.test(signature ?? '')) return false;
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac('sha256', secret).update([kind, id, expires].join('.')).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
