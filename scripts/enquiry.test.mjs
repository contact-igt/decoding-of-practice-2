import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { campaign } from '../lib/course.ts';
import { cleanAttribution, normalisePhone, validateLead } from '../lib/enquiry.ts';
import { leadConfig, signReceipt, verifyReceipt } from '../lib/receipt.ts';

test('normalises Indian mobiles and explicitly formatted international numbers', () => {
  for (const phone of ['98765 43210', '09876543210', '919876543210', '+91 (98765) 43210']) {
    assert.equal(normalisePhone(phone), '+919876543210');
  }
  assert.equal(normalisePhone('+44 7700 900123'), '+447700900123');
  for (const phone of ['1234567890', '+911234567890', '1 9876', '+01234567890', '9876543210x5']) assert.equal(normalisePhone(phone), '');
});

test('validates consent, form choice allowlists and safe campaign variants', () => {
  const fields = { fullName: 'Ada Example', phone: '9876543210', email: '', status: 'Law graduate', objective: 'Improve drafting', timeline: 'Within three months', consent: true };
  assert.deepEqual(validateLead(fields, 'B').errors, {});
  assert.deepEqual(Object.keys(validateLead({ ...fields, status: 'Unknown', consent: 'true' }).errors), ['status', 'consent']);
  assert.equal(campaign('B').id, 'B');
  for (const variant of ['E', 'Z', ['B', 'C'], '<a>', undefined]) assert.equal(campaign(variant).id, 'A');
});

test('caps attribution and strips referrer paths, query values, and unknown keys', () => {
  assert.deepEqual(cleanAttribution({ first: { utm_source: 'Google Ads', utm_medium: 'bad@example.com', unexpected: 'extra', referrer: 'https://google.com/search?q=private' }, latest: { gclid: 'abc_123', fbclid: 'x'.repeat(161) } }), {
    first: { utm_source: 'Google Ads', referrer: 'https://google.com' },
    latest: { gclid: 'abc_123' },
  });
});

test('receipt is signed, time-limited and scoped to its integration mode', () => {
  const key = randomUUID(), config = 'local-test-signature';
  const receipt = signReceipt(key, 'local', config);
  assert.equal(verifyReceipt(receipt, 'local', config), true);
  assert.equal(verifyReceipt(receipt, 'webhook', config), false);
  assert.equal(verifyReceipt(receipt.replace(key, randomUUID()), 'local', config), false);
  assert.equal(verifyReceipt(receipt, 'local', 'other'), false);
});

test('the local test destination is restricted to loopback with indexing off', () => {
  const previous = Object.fromEntries(['DOP_LOCAL_TEST', 'DOP_ALLOW_INDEXING', 'DOP_LEAD_WEBHOOK_URL'].map(key => [key, process.env[key]]));
  try {
    delete process.env.DOP_LEAD_WEBHOOK_URL;
    process.env.DOP_LOCAL_TEST = '1';
    process.env.DOP_ALLOW_INDEXING = 'false';
    assert.equal(leadConfig('127.0.0.1')?.mode, 'local');
    assert.equal(leadConfig('www.vlslawacademy.com'), null);
    process.env.DOP_ALLOW_INDEXING = 'true';
    assert.equal(leadConfig('127.0.0.1'), null);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
