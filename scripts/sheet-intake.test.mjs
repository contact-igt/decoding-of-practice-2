import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

test('assessment delivery fills the nine cells on the registration row and is idempotent', () => {
  const requestId = randomUUID(), token = 'isolated-test-token'.padEnd(32, '0');
  let cells = Array(9).fill('');
  const sheet = {
    getLastRow: () => 2,
    getRange(row, column, height, width) {
      if (row === 1) {
        assert.equal(width, 24);
        return { getValues: () => [headers] };
      }
      if (column === 1) return { createTextFinder: value => ({
        matchEntireCell: () => ({ findNext: () => value === requestId ? { getRow: () => 2 } : null }),
      }) };
      assert.deepEqual([row, column, height, width], [2, 16, 1, 9]);
      return {
        getValues: () => [cells],
        setValues: ([values]) => { cells = Array.from(values); return { setWrap() {} }; },
      };
    },
  };
  const context = {
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: value => ({ setMimeType: () => JSON.parse(value) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === 'INTAKE_TOKEN' ? token : 'staging' }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
  };
  const script = readFileSync(new URL('./google-sheet-intake.gs', import.meta.url), 'utf8');
  const { doPost, headers } = runInNewContext(script + '\n({ doPost, headers: ALL_HEADERS })', context);
  assert.deepEqual(Array.from(headers).slice(15), Array.from({ length: 9 }, (_, i) => 'Question ' + (i + 1)));
  const responses = Array.from({ length: 9 }, (_, i) => ({ question: 'Prompt ' + i, answer: i % 2 ? 'Yes' : 'No' }));
  const send = overrides => doPost({ postData: { contents: JSON.stringify({ token, requestId, responses, action: 'assessment', ...overrides }) } });
  assert.equal(send({ token: 'bad' }).code, 'UNAUTHORIZED');
  assert.equal(send({ responses: responses.slice(0, 8) }).code, 'VALIDATION_FAILED');
  assert.equal(send({ requestId: randomUUID() }).code, 'REGISTRATION_REQUIRED');
  assert.equal(send().duplicate, false);
  assert.deepEqual(cells, responses.map(item => 'Question: ' + item.question + '\nSelected answer: ' + item.answer));
  assert.equal(send().duplicate, true);
  assert.equal(send({ responses: responses.map(item => ({ ...item, answer: 'Different' })) }).code, 'IDEMPOTENCY_CONFLICT');
});
