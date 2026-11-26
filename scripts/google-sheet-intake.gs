// Project name: VLS DOP Registration Intake
// Script Properties: SPREADSHEET_ID, INTAKE_TOKEN (random secret, 32+ characters).
const HEADERS = ['Request ID', 'Received at', 'Full name', 'Mobile number', 'Email address', 'Professional status', 'Contact consent', 'Marketing consent', 'Variant', 'Payload hash', 'Primary learning objective', 'Intended joining timeline', 'Question', 'First attribution', 'Latest attribution'];

function setup() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
  const p = PropertiesService.getScriptProperties();
  const book = SpreadsheetApp.openById(p.getProperty('SPREADSHEET_ID'));
  const sheet = book.getSheetByName('Registrations') || book.insertSheet('Registrations');
  if (sheet.getLastRow()) {
    const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (existing.some((header, index) => header !== HEADERS[index])) throw new Error('Unexpected sheet headers. Keep the existing column order.');
  }
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}

function reply(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    const p = PropertiesService.getScriptProperties();
    const secret = p.getProperty('INTAKE_TOKEN');
    if (!secret || secret.length < 32) return reply({accepted: false, code: 'NOT_CONFIGURED'});
    if (!e || !e.postData || e.postData.contents.length > 16384) return reply({accepted: false, code: 'INVALID_REQUEST'});
    const input = JSON.parse(e.postData.contents);
    if (input.token !== secret) return reply({accepted: false, code: 'UNAUTHORIZED'});
    const lead = input.lead || {};
    const name = String(lead.fullName || '').trim();
    const phone = String(lead.phone || '').trim();
    const email = String(lead.email || '').trim();
    const status = String(lead.status || '').trim();
    const objective = String(lead.objective || '').trim();
    const timeline = String(lead.timeline || '').trim();
    const question = String(lead.question || '').trim();
    const objectives = ['Start legal practice', 'Improve drafting', 'Understand court procedures', 'Build practical confidence', 'Expand into new practice areas', 'Restart my legal career', 'Other'];
    const timelines = ['Immediately', 'Upcoming batch', 'Within three months', 'Currently exploring'];
    if ((objective && objectives.indexOf(objective) < 0) || (timeline && timelines.indexOf(timeline) < 0) || question.length > 500) return reply({accepted: false, code: 'VALIDATION_FAILED'});
    const attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'referrer'];
    function touch(value) {
      const clean = {};
      attributionKeys.forEach(key => {
        if (value && typeof value[key] === 'string' && value[key].length <= 512) clean[key] = value[key];
      });
      return Object.keys(clean).length ? JSON.stringify(clean) : '';
    }
    const extra = [objective, timeline, question, touch(lead.attribution && lead.attribution.first), touch(lead.attribution && lead.attribution.latest)];
    const statuses = ['Pursuing LLB', 'Final-year student', 'Law graduate', 'Junior advocate', 'Practising advocate', 'Returning to legal practice', 'Other'];
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input.requestId || '') || name.length < 2 || name.length > 100 || !/^\+[1-9]\d{7,14}$/.test(phone) || email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email) || statuses.indexOf(status) < 0 || lead.consent !== true) return reply({accepted: false, code: 'VALIDATION_FAILED'});
    const values = [name, phone, email, status, true, lead.marketingConsent === true, /^[A-E]$/.test(lead.variant) ? lead.variant : 'A'];
    const fingerprint = data => Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(data)));
    const hash = fingerprint(values.concat(extra));
    lock.waitLock(10000);
    locked = true;
    const sheet = SpreadsheetApp.openById(p.getProperty('SPREADSHEET_ID')).getSheetByName('Registrations');
    if (!sheet || sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|') !== HEADERS.join('|')) return reply({accepted: false, code: 'RUN_SETUP'});
    const rows = sheet.getLastRow();
    const existing = rows > 1 ? sheet.getRange(2, 1, rows - 1, 1).createTextFinder(input.requestId).matchEntireCell(true).findNext() : null;
    if (existing) {
      const storedHash = sheet.getRange(existing.getRow(), 10).getValue();
      // Preserve retries from the earlier ten-column version when no new data is supplied.
      const matches = storedHash === hash || (extra.every(value => !value) && storedHash === fingerprint(values));
      return matches ? reply({accepted: true, requestId: input.requestId, duplicate: true}) : reply({accepted: false, code: 'IDEMPOTENCY_CONFLICT'});
    }
    // Treat user input as text, including phone '+' and spreadsheet formula prefixes.
    const safe = value => typeof value === 'string' && /^[=+@\-\s]/.test(value) ? "'" + value : value;
    sheet.appendRow([input.requestId, new Date().toISOString()].concat(values.map(safe), [hash], extra.map(safe)));
    SpreadsheetApp.flush();
    return reply({accepted: true, requestId: input.requestId, duplicate: false});
  } catch (_) {
    return reply({accepted: false, code: 'SAVE_FAILED'});
  } finally {
    if (locked) lock.releaseLock();
  }
}
